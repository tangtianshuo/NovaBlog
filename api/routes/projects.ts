import { Router, type Request, type Response } from "express"
import { fileSystem } from "../utils/fileSystem.js"
import { createOrUpdateFile, generateCommitMessage, isGitHubSyncConfigured } from "../utils/githubSync.js"
import { authenticateToken } from "./auth.js"
import type { Project, ProjectMetadata } from "../types.js"
import matter from "gray-matter"
import crypto from "crypto"
import path from "path"

const router = Router()

const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"

const DEFAULT_PROJECT_IMAGE = "/images/default-project.png"

function getProjectPath(project: Project): string {
	const folderName = (project.metadata.slug || project.metadata.title)
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]/g, "")
	return path.join("data", "projects", folderName, "index.md")
}

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

			const filePath = getProjectPath(newProject)
			const cleanMetadata: Record<string, unknown> = {}
			for (const [key, value] of Object.entries(newProject.metadata)) {
				if (value !== undefined && value !== null && value !== "") {
					cleanMetadata[key] = value
				}
			}
			const fileContent = matter.stringify(newProject.content, cleanMetadata)

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
					message: generateCommitMessage("create", "project", newProject.metadata.title),
				})
			} else {
				await fileSystem.saveProject(newProject)
				await createOrUpdateFile({
					path: filePath,
					content: fileContent,
					message: generateCommitMessage("create", "project", newProject.metadata.title),
				})
			}

			res.json({ success: true, data: newProject, synced: true })
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

			const filePath = getProjectPath(updatedProject)
			const cleanMetadata: Record<string, unknown> = {}
			for (const [key, value] of Object.entries(updatedProject.metadata)) {
				if (value !== undefined && value !== null && value !== "") {
					cleanMetadata[key] = value
				}
			}
			const fileContent = matter.stringify(updatedProject.content, cleanMetadata)

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
					message: generateCommitMessage("update", "project", updatedProject.metadata.title),
				})
			} else {
				await fileSystem.saveProject(updatedProject)
				await createOrUpdateFile({
					path: filePath,
					content: fileContent,
					message: generateCommitMessage("update", "project", updatedProject.metadata.title),
				})
			}

			res.json({ success: true, data: updatedProject, synced: true })
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

			if (isVercel) {
				if (!isGitHubSyncConfigured()) {
					res.status(503).json({
						success: false,
						error: "GitHub sync not configured on Vercel. Please configure GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO environment variables.",
					})
					return
				}
			} else {
				await fileSystem.deleteProject(id)
			}
			res.json({ success: true })
		} catch (error) {
			console.error("Error deleting project:", error)
			res.status(500).json({ success: false, error: "Failed to delete project" })
		}
	},
)

export default router
