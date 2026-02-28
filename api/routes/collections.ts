import { Router, type Request, type Response } from "express"
import { fileSystem } from "../utils/fileSystem.js"
import { createOrUpdateFile, generateCommitMessage, isGitHubSyncConfigured } from "../utils/githubSync.js"
import { authenticateToken } from "./auth.js"
import type { Collection } from "../types.js"
import matter from "gray-matter"
import crypto from "crypto"
import path from "path"

const router = Router()

const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"

function getCollectionPath(collection: Collection): string {
	const folderName = (collection.metadata.slug || collection.metadata.title)
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]/g, "")
	return path.join("data", "collections", folderName, "index.md")
}

// API Routes for Collections

router.get("/", async (req: Request, res: Response): Promise<void> => {
	try {
		const collections = await fileSystem.getCollections()
		res.json({ success: true, data: collections })
	} catch (error) {
		console.error("Error fetching collections:", error)
		res.status(500).json({ success: false, error: "Failed to fetch collections" })
	}
})

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params
		const collection = await fileSystem.getCollection(id)
		
		if (!collection) {
			res.status(404).json({ success: false, error: "Collection not found" })
			return
		}

		res.json({ success: true, data: collection })
	} catch (error) {
		console.error("Error fetching collection:", error)
		res.status(500).json({ success: false, error: "Failed to fetch collection" })
	}
})

router.post(
	"/",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { title, description, coverImage, articles, content } = req.body

			if (!title || typeof title !== "string") {
				res.status(400).json({ success: false, error: "Title is required" })
				return
			}

			const id = crypto.randomUUID()
			const now = new Date().toISOString()
			const slug = title
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^\w-]/g, "")

			const newCollection: Collection = {
				metadata: {
					id,
					title,
					slug,
					description: description || "",
					coverImage,
					articles: Array.isArray(articles) ? articles : [],
					createdAt: now,
					updatedAt: now,
				},
				content: content || "",
			}

			const filePath = getCollectionPath(newCollection)
			const cleanMetadata: Record<string, unknown> = {}
			for (const [key, value] of Object.entries(newCollection.metadata)) {
				if (value !== undefined && value !== null && value !== "") {
					cleanMetadata[key] = value
				}
			}
			const fileContent = matter.stringify(newCollection.content, cleanMetadata)

			if (isVercel) {
				if (!isGitHubSyncConfigured()) {
					res.status(503).json({
						success: false,
						error: "GitHub sync not configured on Vercel. Please configure GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO environment variables.",
					})
					return
				}
				await createOrUpdateFile({
					path: filePath,
					content: fileContent,
					message: generateCommitMessage("create", "collection", newCollection.metadata.title),
				})
			} else {
				await fileSystem.saveCollection(newCollection)
				await createOrUpdateFile({
					path: filePath,
					content: fileContent,
					message: generateCommitMessage("create", "collection", newCollection.metadata.title),
				})
			}

			res.json({ success: true, data: newCollection, synced: true })
		} catch (error) {
			console.error("Error creating collection:", error)
			res.status(500).json({ success: false, error: "Failed to create collection" })
		}
	},
)

router.put(
	"/:id",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params
			const updates = req.body

			if (!updates || !updates.metadata) {
				res.status(400).json({ success: false, error: "Invalid request body" })
				return
			}

			const existingCollection = await fileSystem.getCollection(id)
			if (!existingCollection) {
				res.status(404).json({ success: false, error: "Collection not found" })
				return
			}

			const metadata = {
				...existingCollection.metadata,
				...updates.metadata,
				updatedAt: new Date().toISOString(),
			}

			const updatedCollection: Collection = {
				metadata,
				content: updates.content !== undefined ? updates.content : existingCollection.content,
			}

			const filePath = getCollectionPath(updatedCollection)
			const cleanMetadata: Record<string, unknown> = {}
			for (const [key, value] of Object.entries(updatedCollection.metadata)) {
				if (value !== undefined && value !== null && value !== "") {
					cleanMetadata[key] = value
				}
			}
			const fileContent = matter.stringify(updatedCollection.content, cleanMetadata)

			if (isVercel) {
				if (!isGitHubSyncConfigured()) {
					res.status(503).json({
						success: false,
						error: "GitHub sync not configured on Vercel. Please configure GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO environment variables.",
					})
					return
				}
				await createOrUpdateFile({
					path: filePath,
					content: fileContent,
					message: generateCommitMessage("update", "collection", updatedCollection.metadata.title),
				})
			} else {
				await fileSystem.saveCollection(updatedCollection)
				await createOrUpdateFile({
					path: filePath,
					content: fileContent,
					message: generateCommitMessage("update", "collection", updatedCollection.metadata.title),
				})
			}

			res.json({ success: true, data: updatedCollection, synced: true })
		} catch (error) {
			console.error("Error updating collection:", error)
			res.status(500).json({ success: false, error: "Failed to update collection" })
		}
	},
)

router.delete(
	"/:id",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params

			if (isVercel) {
				if (!isGitHubSyncConfigured()) {
					res.status(503).json({
						success: false,
						error: "GitHub sync not configured on Vercel. Please configure GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO environment variables.",
					})
					return
				}
			} else {
				await fileSystem.deleteCollection(id)
			}
			res.json({ success: true })
		} catch (error) {
			console.error("Error deleting collection:", error)
			res.status(500).json({ success: false, error: "Failed to delete collection" })
		}
	},
)

export default router
