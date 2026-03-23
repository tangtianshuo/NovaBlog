const DB_NAME = "novablog-sync"
const DB_VERSION = 3

export interface SyncItem {
	id: string
	type: "document" | "project" | "collection" | "resume" | "delete"
	action: "create" | "update" | "delete"
	data: unknown
	timestamp: number
}

export interface LocalItem {
	id: string
	type: "document" | "project" | "collection" | "resume"
	action: "create" | "update"
	metadata: Record<string, unknown>
	content: string
	timestamp: number
}

export interface TrashStoreItem {
	id: string
	itemId: string
	type: "document" | "project" | "collection"
	title: string
	deletedAt: number
	data?: {
		metadata: Record<string, unknown>
		content: string
	}
}

export interface MediaStoreItem {
	id: string
	documentId: string
	filename: string
	data: string
	type: string
	size: number
	path: string
	timestamp: number
}

class IndexedDBManager {
	private db: IDBDatabase | null = null
	private notifyQueueChanged = () => {
		if (typeof window === "undefined") return
		window.dispatchEvent(new CustomEvent("syncdb:queue-changed"))
	}

	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION)

			request.onerror = () => reject(request.error)

			request.onsuccess = () => {
				this.db = request.result
				resolve()
			}

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result

				if (!db.objectStoreNames.contains("syncQueue")) {
					db.createObjectStore("syncQueue", { keyPath: "id" })
				}

				if (!db.objectStoreNames.contains("trash")) {
					db.createObjectStore("trash", { keyPath: "id" })
				}

				if (!db.objectStoreNames.contains("media")) {
					db.createObjectStore("media", { keyPath: "id" })
				}
			}
		})
	}

	private async getDB(): Promise<IDBDatabase> {
		if (!this.db) {
			await this.init()
		}
		return this.db!
	}

	private async getDBWithTrash(): Promise<IDBDatabase> {
		if (!this.db || !this.db.objectStoreNames.contains("trash")) {
			this.db = null
			await this.init()
		}
		return this.db!
	}

	async addToQueue(item: SyncItem): Promise<void> {
		const db = await this.getDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("syncQueue", "readwrite")
			const store = transaction.objectStore("syncQueue")
			const request = store.put(item)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => {
				this.notifyQueueChanged()
				resolve()
			}
		})
	}

	async getQueue(): Promise<SyncItem[]> {
		const db = await this.getDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("syncQueue", "readonly")
			const store = transaction.objectStore("syncQueue")
			const request = store.getAll()
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result)
		})
	}

	async clearQueue(): Promise<void> {
		const db = await this.getDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("syncQueue", "readwrite")
			const store = transaction.objectStore("syncQueue")
			const request = store.clear()
			request.onerror = () => reject(request.error)
			request.onsuccess = () => {
				this.notifyQueueChanged()
				resolve()
			}
		})
	}

	async removeFromQueue(id: string): Promise<void> {
		const db = await this.getDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("syncQueue", "readwrite")
			const store = transaction.objectStore("syncQueue")
			const request = store.delete(id)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => {
				this.notifyQueueChanged()
				resolve()
			}
		})
	}

	async reconcileWithRemoteIndex(remote: {
		documents: { id: string; updatedAt?: string }[]
		projects: { id: string; updatedAt?: string }[]
		collections: { id: string; updatedAt?: string }[]
	}): Promise<{ removed: number }>{
		const docs = new Map(remote.documents.map((d) => [d.id, d.updatedAt]))
		const projs = new Map(remote.projects.map((p) => [p.id, p.updatedAt]))
		const cols = new Map(remote.collections.map((c) => [c.id, c.updatedAt]))

		const items = await this.getQueue()
		let removed = 0

		for (const item of items) {
			const meta = (item.data as { metadata?: { id?: string } })?.metadata
			const entityId = (meta?.id as string | undefined) || item.id

			if (item.type === "document" || item.type === "project" || item.type === "collection") {
				const updatedAt =
					item.type === "document"
						? docs.get(entityId)
						: item.type === "project"
							? projs.get(entityId)
							: cols.get(entityId)
				if (!updatedAt) continue
				const remoteTs = Date.parse(updatedAt)
				if (Number.isFinite(remoteTs) && remoteTs >= item.timestamp) {
					await this.removeFromQueue(item.id)
					removed += 1
				}
				continue
			}

			if (item.type === "delete") {
				const payload = item.data as { id?: string; type?: "document" | "project" | "collection" }
				const targetId = payload?.id
				const targetType = payload?.type
				if (!targetId || !targetType) continue
				const exists =
					targetType === "document"
						? docs.has(targetId)
						: targetType === "project"
							? projs.has(targetId)
							: cols.has(targetId)
				if (!exists) {
					await this.removeFromQueue(item.id)
					removed += 1
				}
			}
		}

		return { removed }
	}

	async getQueueCount(): Promise<number> {
		const items = await this.getQueue()
		return items.length
	}

	async getDraftCount(): Promise<number> {
		const items = await this.getQueue()
		return items.filter(
			(item) =>
				item.type === "document" &&
				(item.data as { metadata?: { status?: string } })?.metadata?.status === "draft",
		).length
	}

	async clearDrafts(): Promise<void> {
		const items = await this.getQueue()
		const draftItems = items.filter(
			(item) =>
				item.type === "document" &&
				(item.data as { metadata?: { status?: string } })?.metadata?.status === "draft",
		)
		for (const item of draftItems) {
			await this.removeFromQueue(item.id)
		}
	}

	async saveDocument(doc: { metadata: Record<string, unknown>; content: string }, id?: string): Promise<string> {
		const docId = id || crypto.randomUUID()
		await this.addToQueue({
			id: docId,
			type: "document",
			action: id ? "update" : "create",
			data: doc,
			timestamp: Date.now(),
		})
		return docId
	}

	async saveProject(project: { metadata: Record<string, unknown>; content: string }, id?: string): Promise<string> {
		const projectId = id || crypto.randomUUID()
		await this.addToQueue({
			id: projectId,
			type: "project",
			action: id ? "update" : "create",
			data: project,
			timestamp: Date.now(),
		})
		return projectId
	}

	async saveCollection(collection: { metadata: Record<string, unknown>; content: string }, id?: string): Promise<string> {
		const collectionId = id || crypto.randomUUID()
		await this.addToQueue({
			id: collectionId,
			type: "collection",
			action: id ? "update" : "create",
			data: collection,
			timestamp: Date.now(),
		})
		return collectionId
	}

	async deleteDocument(id: string): Promise<void> {
		await this.addToQueue({
			id: `delete-${id}`,
			type: "delete",
			action: "delete",
			data: { id },
			timestamp: Date.now(),
		})
	}

	async deleteProject(id: string): Promise<void> {
		await this.addToQueue({
			id: `delete-project-${id}`,
			type: "delete",
			action: "delete",
			data: { id, type: "project" },
			timestamp: Date.now(),
		})
	}

	async deleteCollection(id: string): Promise<void> {
		await this.addToQueue({
			id: `delete-collection-${id}`,
			type: "delete",
			action: "delete",
			data: { id, type: "collection" },
			timestamp: Date.now(),
		})
	}

	async getLocalDocuments(): Promise<LocalItem[]> {
		const items = await this.getQueue()
		return items
			.filter(item => item.type === "document" && item.action !== "delete")
			.map(item => ({
				id: (item.data as { metadata: Record<string, unknown> }).metadata.id as string || item.id,
				type: "document" as const,
				action: item.action as "create" | "update",
				metadata: (item.data as { metadata: Record<string, unknown> }).metadata,
				content: (item.data as { content: string }).content || "",
				timestamp: item.timestamp,
			}))
	}

	async getLocalProjects(): Promise<LocalItem[]> {
		const items = await this.getQueue()
		return items
			.filter(item => item.type === "project" && item.action !== "delete")
			.map(item => ({
				id: (item.data as { metadata: Record<string, unknown> }).metadata.id as string || item.id,
				type: "project" as const,
				action: item.action as "create" | "update",
				metadata: (item.data as { metadata: Record<string, unknown> }).metadata,
				content: (item.data as { content: string }).content || "",
				timestamp: item.timestamp,
			}))
	}

	async getLocalCollections(): Promise<LocalItem[]> {
		const items = await this.getQueue()
		return items
			.filter(item => item.type === "collection" && item.action !== "delete")
			.map(item => ({
				id: (item.data as { metadata: Record<string, unknown> }).metadata.id as string || item.id,
				type: "collection" as const,
				action: item.action as "create" | "update",
				metadata: (item.data as { metadata: Record<string, unknown> }).metadata,
				content: (item.data as { content: string }).content || "",
				timestamp: item.timestamp,
			}))
	}

	async saveResume(resume: { metadata: Record<string, unknown>; content: unknown }, id?: string): Promise<string> {
		const resumeId = id || "resume"
		await this.addToQueue({
			id: resumeId,
			type: "resume",
			action: id ? "update" : "create",
			data: resume,
			timestamp: Date.now(),
		})
		return resumeId
	}

	async getLocalResume(): Promise<LocalItem | null> {
		const items = await this.getQueue()
		const resumeItem = items.find(item => item.type === "resume" && item.action !== "delete")
		if (!resumeItem) return null
		return {
			id: "resume",
			type: "resume",
			action: resumeItem.action as "create" | "update",
			metadata: (resumeItem.data as { metadata: Record<string, unknown> }).metadata,
			content: JSON.stringify((resumeItem.data as { content: unknown }).content || ""),
			timestamp: resumeItem.timestamp,
		}
	}

	private async getMediaDB(): Promise<IDBDatabase> {
		if (!this.db || !this.db.objectStoreNames.contains("media")) {
			this.db = null
			await this.init()
		}
		return this.db!
	}

	async saveMedia(media: MediaStoreItem): Promise<void> {
		const db = await this.getMediaDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("media", "readwrite")
			const store = transaction.objectStore("media")
			const request = store.put(media)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve()
		})
	}

	async getMedia(id: string): Promise<MediaStoreItem | null> {
		const db = await this.getMediaDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("media", "readonly")
			const store = transaction.objectStore("media")
			const request = store.get(id)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result || null)
		})
	}

	async getMediaByDocumentId(documentId: string): Promise<MediaStoreItem[]> {
		const db = await this.getMediaDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("media", "readonly")
			const store = transaction.objectStore("media")
			const request = store.getAll()
			request.onerror = () => reject(request.error)
			request.onsuccess = () => {
				const all = request.result as MediaStoreItem[]
				resolve(all.filter(m => m.documentId === documentId))
			}
		})
	}

	async getAllMedia(): Promise<MediaStoreItem[]> {
		const db = await this.getMediaDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("media", "readonly")
			const store = transaction.objectStore("media")
			const request = store.getAll()
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result)
		})
	}

	async deleteMedia(id: string): Promise<void> {
		const db = await this.getMediaDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("media", "readwrite")
			const store = transaction.objectStore("media")
			const request = store.delete(id)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve()
		})
	}

	async clearMedia(): Promise<void> {
		const db = await this.getMediaDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("media", "readwrite")
			const store = transaction.objectStore("media")
			const request = store.clear()
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve()
		})
	}

	async getLocalItemById(id: string): Promise<LocalItem | null> {
		const items = await this.getQueue()
		const item = items.find(i => 
			(i.data as { metadata?: Record<string, unknown> })?.metadata?.id === id ||
			i.id === id
		)
		if (!item || item.action === "delete") return null
		return {
			id: (item.data as { metadata: Record<string, unknown> }).metadata?.id as string || item.id,
			type: item.type as "document" | "project" | "collection",
			action: item.action as "create" | "update",
			metadata: (item.data as { metadata: Record<string, unknown> }).metadata,
			content: (item.data as { content: string }).content || "",
			timestamp: item.timestamp,
		}
	}

	async addToTrash(item: TrashStoreItem): Promise<void> {
		const db = await this.getDBWithTrash()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("trash", "readwrite")
			const store = transaction.objectStore("trash")
			const request = store.put(item)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve()
		})
	}

	async getTrashItems(): Promise<TrashStoreItem[]> {
		const db = await this.getDBWithTrash()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("trash", "readonly")
			const store = transaction.objectStore("trash")
			const request = store.getAll()
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve(request.result)
		})
	}

	async removeFromTrash(id: string): Promise<void> {
		const db = await this.getDBWithTrash()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("trash", "readwrite")
			const store = transaction.objectStore("trash")
			const request = store.delete(id)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve()
		})
	}

	async clearTrash(): Promise<void> {
		const db = await this.getDBWithTrash()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("trash", "readwrite")
			const store = transaction.objectStore("trash")
			const request = store.clear()
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve()
		})
	}

	async getTrashCount(): Promise<number> {
		const items = await this.getTrashItems()
		return items.length
	}
}

export const syncDB = new IndexedDBManager()
