const DB_NAME = "novablog-sync"
const DB_VERSION = 1

export interface SyncItem {
	id: string
	type: "document" | "project" | "collection" | "delete"
	action: "create" | "update" | "delete"
	data: unknown
	timestamp: number
}

export interface LocalItem {
	id: string
	type: "document" | "project" | "collection"
	action: "create" | "update"
	metadata: Record<string, unknown>
	content: string
	timestamp: number
}

class IndexedDBManager {
	private db: IDBDatabase | null = null

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
			}
		})
	}

	private async getDB(): Promise<IDBDatabase> {
		if (!this.db) {
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
			request.onsuccess = () => resolve()
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
			request.onsuccess = () => resolve()
		})
	}

	async removeFromQueue(id: string): Promise<void> {
		const db = await this.getDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction("syncQueue", "readwrite")
			const store = transaction.objectStore("syncQueue")
			const request = store.delete(id)
			request.onerror = () => reject(request.error)
			request.onsuccess = () => resolve()
		})
	}

	async getQueueCount(): Promise<number> {
		const items = await this.getQueue()
		return items.length
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
}

export const syncDB = new IndexedDBManager()
