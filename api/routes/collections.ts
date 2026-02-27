import { Router, type Request, type Response } from "express"
import { fileSystem } from "../utils/fileSystem.js"
import { authenticateToken } from "./auth.js"
import type { Collection } from "../types.js"
import crypto from "crypto"

const router = Router()

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

			await fileSystem.saveCollection(newCollection)
			res.json({ success: true, data: newCollection })
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

			await fileSystem.saveCollection(updatedCollection)
			res.json({ success: true, data: updatedCollection })
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
			await fileSystem.deleteCollection(id)
			res.json({ success: true })
		} catch (error) {
			console.error("Error deleting collection:", error)
			res.status(500).json({ success: false, error: "Failed to delete collection" })
		}
	},
)

export default router
