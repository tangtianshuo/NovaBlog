import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"
import type {
	Document,
	DocumentMetadata,
	User,
	Project,
	ProjectMetadata,
} from "../types.js"

const DATA_DIR = path.resolve(process.cwd(), "data")
const DOCUMENTS_DIR = path.join(DATA_DIR, "documents")
const PROJECTS_DIR = path.join(DATA_DIR, "projects")
const USERS_FILE = path.join(DATA_DIR, "users.json")

// Helper to sanitize folder names
const sanitizeName = (name: string) => name.replace(/[\\/:*?"<>|]/g, "-")

export const fileSystem = {
	// Users
	async getUsers(): Promise<User[]> {
		try {
			const data = await fs.readFile(USERS_FILE, "utf-8")
			return JSON.parse(data)
		} catch (error) {
			return []
		}
	},

	// Documents
	async getDocuments(
		status: "draft" | "published",
	): Promise<DocumentMetadata[]> {
		const dir = path.join(DOCUMENTS_DIR, status)
		const docs: DocumentMetadata[] = []

		async function traverse(currentDir: string, relativePath: string = "") {
			try {
				const entries = await fs.readdir(currentDir, { withFileTypes: true })
				for (const entry of entries) {
					const fullPath = path.join(currentDir, entry.name)
					if (entry.isDirectory()) {
						// Check if this directory is a document container (has index.md)
						// OR if it is a category folder.
						// Our structure: documents/{status}/{title}/index.md
						// OR documents/{status}/{category}/{title}/index.md

						// We check if index.md exists inside.
						try {
							await fs.access(path.join(fullPath, "index.md"))
							// It is a document folder
							const fileContent = await fs.readFile(
								path.join(fullPath, "index.md"),
								"utf-8",
							)
							const { data } = matter(fileContent)
							if (data.id) {
								docs.push(data as DocumentMetadata)
							}

							// Also traverse inside? A document folder might have sub-folders?
							// PRD says: "If sub-chapter, create folder in parent chapter".
							// So yes, we should traverse recursively.
							await traverse(fullPath, path.join(relativePath, entry.name))
						} catch {
							// No index.md, just a category folder?
							await traverse(fullPath, path.join(relativePath, entry.name))
						}
					}
				}
			} catch (e) {
				// directory might not exist
			}
		}

		await traverse(dir)
		return docs.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)
	},

	async getDocument(id: string): Promise<Document | null> {
		// Search in both drafts and published
		let result = await this.findDocumentPath(id, "draft")
		if (!result) {
			result = await this.findDocumentPath(id, "published")
		}

		if (!result) return null

		const fileContent = await fs.readFile(result.filePath, "utf-8")
		const { data, content } = matter(fileContent)
		return {
			metadata: data as DocumentMetadata,
			content,
		}
	},

	async findDocumentPath(
		id: string,
		status: "draft" | "published",
	): Promise<{ filePath: string; folderPath: string } | null> {
		const dir = path.join(DOCUMENTS_DIR, status)

		async function traverse(
			currentDir: string,
		): Promise<{ filePath: string; folderPath: string } | null> {
			try {
				const entries = await fs.readdir(currentDir, { withFileTypes: true })
				for (const entry of entries) {
					const fullPath = path.join(currentDir, entry.name)
					if (entry.isDirectory()) {
						// Check index.md
						try {
							const indexPath = path.join(fullPath, "index.md")
							const fileContent = await fs.readFile(indexPath, "utf-8")
							const { data } = matter(fileContent)
							if (data.id === id) {
								return { filePath: indexPath, folderPath: fullPath }
							}
						} catch {}

						// Recurse
						const found = await traverse(fullPath)
						if (found) return found
					}
				}
			} catch {
				return null
			}
			return null
		}

		return traverse(dir)
	},

	async saveDocument(doc: Document): Promise<void> {
		const { metadata, content } = doc

		const cleanMetadata: Record<string, any> = {}
		for (const [key, value] of Object.entries(metadata)) {
			if (value !== undefined && value !== null && value !== "") {
				cleanMetadata[key] = value
			}
		}

		const fileContent = matter.stringify(content, cleanMetadata)

		// Find existing to see if we need to delete old one (e.g. status change or move)
		// Note: We search by ID.
		// If it's a new document, ID should be new.

		const existingDraft = await this.findDocumentPath(metadata.id, "draft")
		const existingPublished = await this.findDocumentPath(
			metadata.id,
			"published",
		)

		const existing = existingDraft || existingPublished
		const oldStatus = existingDraft
			? "draft"
			: existingPublished
				? "published"
				: null

		// Determine target path
		// Default: documents/{status}/{sanitized_title}/index.md
		// If category exists: documents/{status}/{category}/{sanitized_title}/index.md
		// Note: Category logic is simplified here.

		const statusDir = path.join(DOCUMENTS_DIR, metadata.status)
		const folderName = sanitizeName(metadata.title)

		// Construct target folder path
		// We assume 'category' in metadata is a relative path string like "tech/js"
		let targetFolder = path.join(statusDir, folderName)
		if (metadata.category) {
			targetFolder = path.join(statusDir, metadata.category, folderName)
		}

		const targetFile = path.join(targetFolder, "index.md")

		// If existing found and location/status changed, delete old
		if (existing && existing.filePath !== targetFile) {
			// If we rename or move, we should move the whole folder to preserve assets?
			// Yes, move folder.
			// But what if the folder structure changed?
			// E.g. moved from /Drafts/A to /Published/A

			// Simple approach: Move the folder content.
			// But wait, existing.folderPath is the folder containing index.md.
			// targetFolder is the new folder.

			// Ensure target parent exists
			await fs.mkdir(path.dirname(targetFolder), { recursive: true })

			// Move
			try {
				await fs.rename(existing.folderPath, targetFolder)
			} catch (e) {
				// Fallback: Copy and delete if rename fails (cross-device?)
				// But we are on same FS.
				// If target exists?
				// If target exists, rename might fail or overwrite.
				// Let's assume unique titles for now or overwrite.
			}
		} else {
			// Create directory if not exists
			await fs.mkdir(targetFolder, { recursive: true })
		}

		// Write file (overwrite content)
		await fs.writeFile(path.join(targetFolder, "index.md"), fileContent)
	},

	async deleteDocument(id: string): Promise<void> {
		const existing =
			(await this.findDocumentPath(id, "draft")) ||
			(await this.findDocumentPath(id, "published"))
		if (existing) {
			await fs.rm(existing.folderPath, { recursive: true, force: true })
		}
	},

	// Projects
	async getProjects(): Promise<ProjectMetadata[]> {
		try {
			const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })
			const projects: ProjectMetadata[] = []

			for (const entry of entries) {
				if (entry.isDirectory()) {
					const projectPath = path.join(PROJECTS_DIR, entry.name)
					const indexPath = path.join(projectPath, "index.md")

					try {
						const fileContent = await fs.readFile(indexPath, "utf-8")
						const { data } = matter(fileContent)
						if (data.id) {
							projects.push(data as ProjectMetadata)
						}
					} catch (error) {
						// Skip if no index.md
					}
				}
			}

			return projects.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			)
		} catch (error) {
			return []
		}
	},

	async getProject(id: string): Promise<Project | null> {
		try {
			const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.isDirectory()) {
					const projectPath = path.join(PROJECTS_DIR, entry.name)
					const indexPath = path.join(projectPath, "index.md")

					try {
						const fileContent = await fs.readFile(indexPath, "utf-8")
						const { data, content } = matter(fileContent)
						if (data.id === id) {
							return {
								metadata: data as ProjectMetadata,
								content,
							}
						}
					} catch {}
				}
			}
			return null
		} catch (error) {
			return null
		}
	},

	async saveProject(project: Project): Promise<void> {
		const { metadata, content } = project

		const cleanMetadata: Record<string, any> = {}
		for (const [key, value] of Object.entries(metadata)) {
			if (value !== undefined && value !== null && value !== "") {
				cleanMetadata[key] = value
			}
		}

		const fileContent = matter.stringify(content, cleanMetadata)
		const folderName = sanitizeName(metadata.slug || metadata.title)
		const targetFolder = path.join(PROJECTS_DIR, folderName)

		await fs.mkdir(targetFolder, { recursive: true })
		await fs.writeFile(path.join(targetFolder, "index.md"), fileContent)
	},

	async deleteProject(id: string): Promise<void> {
		try {
			const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.isDirectory()) {
					const projectPath = path.join(PROJECTS_DIR, entry.name)
					const indexPath = path.join(projectPath, "index.md")

					try {
						const fileContent = await fs.readFile(indexPath, "utf-8")
						const { data } = matter(fileContent)
						if (data.id === id) {
							await fs.rm(projectPath, { recursive: true, force: true })
							return
						}
					} catch {}
				}
			}
		} catch (error) {
			console.error("Error deleting project:", error)
		}
	},
}
