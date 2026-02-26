import { Router, type Request, type Response } from "express"
import { fileSystem } from "../utils/fileSystem.js"
import { authenticateToken } from "./auth.js"
import type { Resume } from "../types.js"
import crypto from "crypto"

const router = Router()

router.get("/", async (req: Request, res: Response): Promise<void> => {
	try {
		const resume = await fileSystem.getResume()
		res.json({ success: true, data: resume })
	} catch (error) {
		res.status(500).json({ success: false, error: "Failed to fetch resume" })
	}
})

router.post(
	"/",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { metadata, content } = req.body

			const now = new Date().toISOString()
			const existingResume = await fileSystem.getResume()

			const resume: Resume = {
				metadata: {
					id: existingResume?.metadata.id || crypto.randomUUID(),
					name: metadata.name || "",
					title: metadata.title || "",
					email: metadata.email || "",
					phone: metadata.phone || "",
					location: metadata.location || "",
					website: metadata.website || "",
					github: metadata.github || "",
					linkedin: metadata.linkedin || "",
					summary: metadata.summary || "",
					skills: metadata.skills || [],
					createdAt: existingResume?.metadata.createdAt || now,
					updatedAt: now,
				},
				content: {
					education: content.education || [],
					experience: content.experience || [],
					projects: content.projects || [],
					certifications: content.certifications || [],
					awards: content.awards || [],
				},
			}

			await fileSystem.saveResume(resume)
			res.json({ success: true, data: resume })
		} catch (error) {
			console.error("Error saving resume:", error)
			res.status(500).json({ success: false, error: "Failed to save resume" })
		}
	},
)

export default router
