import { Router, type Request, type Response } from "express"
import { fileSystem } from "../utils/fileSystem.js"
import { authenticateToken } from "./auth.js"
import type { Project, ProjectMetadata } from "../types.js"
import crypto from "crypto"

const router = Router()

const DEFAULT_PROJECT_IMAGE = "/images/default-project.png"

const PROJECTS_DIR = process.env.PROJECTS_DIR || "data/projects"

// API Routes for Projects

router.get("/", async (req: Request, res: Response): Promise<void> => {
	try {
		const projects = await fileSystem.getProjects()
		
		const projectsWithDefaultImage = projects.map(project => ({
			...project,
			imageUrl: project.imageUrl || DEFAULT_PROJECT_IMAGE
		}))
		
		res.json({ success: true, data: projectsWithDefaultImage })
	} catch (error) {
		console.error("Error fetching projects:", error)
		res.status(500).json({ success: false, error: "Failed to fetch projects" })
	}
})

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params
		const project = await fileSystem.getProject(id)
		
		if (!project) {
			res.status(404).json({ success: false, error: "Project not found" })
			return
		}

		const projectWithDefaultImage = {
			...project,
			metadata: {
				...project.metadata,
				imageUrl: project.metadata.imageUrl || DEFAULT_PROJECT_IMAGE
			}
		}
		
		res.json({ success: true, data: projectWithDefaultImage })
	} catch (error) {
		console.error("Error fetching project:", error)
		res.status(500).json({ success: false, error: "Failed to fetch project" })
	}
})

router.post(
	"/",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { title, description, imageUrl, link, tags, content } = req.body

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

			const newProject: Project = {
				metadata: {
					id,
					title,
					slug,
					description: description || "",
					imageUrl: imageUrl || "",
					link: link || "",
					tags: Array.isArray(tags) ? tags : [],
					createdAt: now,
					updatedAt: now,
				},
				content: content || "",
			}

			await fileSystem.saveProject(newProject)
			res.json({ success: true, data: newProject })
		} catch (error) {
			console.error("Error creating project:", error)
			res.status(500).json({ success: false, error: "Failed to create project" })
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

			const existingProject = await fileSystem.getProject(id)
			if (!existingProject) {
				res.status(404).json({ success: false, error: "Project not found" })
				return
			}

			const metadata = {
				...existingProject.metadata,
				...updates.metadata,
				updatedAt: new Date().toISOString(),
			}

			const updatedProject: Project = {
				metadata,
				content: updates.content !== undefined ? updates.content : existingProject.content,
			}

			await fileSystem.saveProject(updatedProject)
			res.json({ success: true, data: updatedProject })
		} catch (error) {
			console.error("Error updating project:", error)
			res.status(500).json({ success: false, error: "Failed to update project" })
		}
	},
)

router.delete(
	"/:id",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { id } = req.params
			await fileSystem.deleteProject(id)
			res.json({ success: true })
		} catch (error) {
			console.error("Error deleting project:", error)
			res.status(500).json({ success: false, error: "Failed to delete project" })
		}
	},
)

export default router
