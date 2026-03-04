import { Router, type Request, type Response } from "express"
import { authenticateToken } from "./auth.js"
import {
	createOrUpdateFile,
	generateCommitMessage,
	deleteFile,
	isGitHubSyncConfigured,
	getFile,
} from "../utils/githubSync.js"
import matter from "gray-matter"
import path from "path"

const router = Router()

const isVercel =
	process.env.VERCEL === "1" || process.env.NODE_ENV === "production"

interface SyncItem {
	id: string
	type: "document" | "project" | "collection" | "delete"
	action: "create" | "update" | "delete"
	data: {
		metadata?: Record<string, unknown>
		content?: string
		id?: string
		type?: string
	}
	timestamp: number
}

function getDocumentPath(
	metadata: Record<string, unknown>,
	status?: string,
): string {
	const statusDir = status || (metadata.status as string) || "draft"
	const folderName = (metadata.title as string)
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\w-]/g, "")
	let targetFolder = path.join(statusDir, folderName)
	if (metadata.category && statusDir === "draft") {
		targetFolder = path.join(statusDir, metadata.category as string, folderName)
	}
	return path.join("data", "documents", targetFolder, "index.md")
}

function getDraftPathById(docId: string): string {
	return `data/documents/draft/${docId}/index.md`
}

function getPublishedPathById(docId: string): string {
	return `data/documents/published/${docId}/index.md`
}

function getProjectPath(metadata: Record<string, unknown>): string {
	const folderName =
		(metadata.slug || metadata.title)
			?.toString()
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^\w-]/g, "") || ""
	return path.join("data", "projects", folderName, "index.md")
}

function getCollectionPath(metadata: Record<string, unknown>): string {
	const folderName =
		(metadata.slug || metadata.title)
			?.toString()
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^\w-]/g, "") || ""
	return path.join("data", "collections", folderName, "index.md")
}

router.post(
	"/",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { items, mediaMap } = req.body as {
				items: SyncItem[]
				mediaMap?: Record<
					string,
					{ filename: string; data: string; type: string }[]
				>
			}

			if (!Array.isArray(items) || items.length === 0) {
				res.status(400).json({ success: false, error: "No items to sync" })
				return
			}

			if (isVercel && !isGitHubSyncConfigured()) {
				res.status(503).json({
					success: false,
					error: "GitHub sync not configured on Vercel",
				})
				return
			}

			if (mediaMap) {
				for (const [docId, mediaList] of Object.entries(mediaMap)) {
					for (const media of mediaList) {
						try {
							const base64Data = media.data.replace(/^data:[^;]+;base64,/, "")
							const buffer = Buffer.from(base64Data, "base64")
							const mediaPath = `data/documents/${docId}/assets/${media.filename}`

							await createOrUpdateFile({
								path: mediaPath,
								content: buffer.toString("base64"),
								message: `上传媒体文件: ${media.filename}`,
							})
						} catch (mediaError) {
							console.error("Error uploading media:", mediaError)
						}
					}
				}
			}

			const results: {
				id: string
				success: boolean
				error?: string
				warning?: string
			}[] = []

			for (const item of items) {
				try {
					if (item.type === "delete") {
						const deleteData = item.data as { id: string; type?: string }
						let filePath: string

						if (deleteData.type === "project") {
							filePath = `data/projects/${deleteData.id}/index.md`
						} else if (deleteData.type === "collection") {
							filePath = `data/collections/${deleteData.id}/index.md`
						} else {
							filePath = `data/documents/draft/${deleteData.id}/index.md`
						}

						await deleteFile({
							path: filePath,
							message: generateCommitMessage(
								"delete",
								(deleteData.type as "document" | "project" | "collection") ||
									"document",
								deleteData.id,
							),
						})
						results.push({ id: item.id, success: true })
					} else if (item.type === "document") {
						const metadata = item.data.metadata as Record<string, unknown>
						const content = item.data.content as string
						const docId = metadata.id as string
						const status = metadata.status as string

						if (status === "draft") {
							results.push({
								id: item.id,
								success: true,
								warning: "草稿不进入Git同步",
							})
							continue
						}

						let draftDeleted = false
						let conflictWarning = ""

						if (status === "published") {
							const draftPath = getDraftPathById(docId)
							const draftContent = await getFile(draftPath)

							if (draftContent) {
								await deleteFile({
									path: draftPath,
									message: `删除草稿: ${metadata.title} (已发布)`,
								})
								draftDeleted = true
							}
						}

						const otherStatus = status === "published" ? "draft" : "published"
						const otherPath =
							status === "published"
								? getDraftPathById(docId)
								: getPublishedPathById(docId)
						const otherContent = await getFile(otherPath)

						if (otherContent && otherContent.includes(`id: ${docId}`)) {
							conflictWarning = `警告: 存在冲突的${status === "published" ? "草稿" : "已发布"}版本，已被覆盖`
						}

						const filePath = getDocumentPath(metadata)
						const cleanMetadata: Record<string, unknown> = {}
						for (const [key, value] of Object.entries(metadata)) {
							if (value !== undefined && value !== null && value !== "") {
								cleanMetadata[key] = value
							}
						}
						const fileContent = matter.stringify(content || "", cleanMetadata)

						await createOrUpdateFile({
							path: filePath,
							content: fileContent,
							message: generateCommitMessage(
								item.action,
								"document",
								metadata.title as string,
							),
						})

						let resultMessage = "success"
						if (draftDeleted) {
							resultMessage = "success-draft-deleted"
						}
						results.push({
							id: item.id,
							success: true,
							warning: conflictWarning || undefined,
						})
					} else if (item.type === "project") {
						const metadata = item.data.metadata as Record<string, unknown>
						const content = item.data.content as string

						const filePath = getProjectPath(metadata)
						const cleanMetadata: Record<string, unknown> = {}
						for (const [key, value] of Object.entries(metadata)) {
							if (value !== undefined && value !== null && value !== "") {
								cleanMetadata[key] = value
							}
						}
						const fileContent = matter.stringify(content || "", cleanMetadata)

						await createOrUpdateFile({
							path: filePath,
							content: fileContent,
							message: generateCommitMessage(
								item.action,
								"project",
								metadata.title as string,
							),
						})
						results.push({ id: item.id, success: true })
					} else if (item.type === "collection") {
						const metadata = item.data.metadata as Record<string, unknown>
						const content = item.data.content as string

						const filePath = getCollectionPath(metadata)
						const cleanMetadata: Record<string, unknown> = {}
						for (const [key, value] of Object.entries(metadata)) {
							if (value !== undefined && value !== null && value !== "") {
								cleanMetadata[key] = value
							}
						}
						const fileContent = matter.stringify(content || "", cleanMetadata)

						await createOrUpdateFile({
							path: filePath,
							content: fileContent,
							message: generateCommitMessage(
								item.action,
								"collection",
								metadata.title as string,
							),
						})
						results.push({ id: item.id, success: true })
					} else if (item.type === "resume") {
						const metadata = item.data.metadata as Record<string, unknown>
						const content = item.data.content as unknown as Record<
							string,
							unknown
						>

						const resumeData = {
							metadata: {
								id: "resume",
								name: (metadata.name as string) || "",
								title: (metadata.title as string) || "",
								email: (metadata.email as string) || "",
								phone: (metadata.phone as string) || "",
								location: (metadata.location as string) || "",
								website: (metadata.website as string) || "",
								github: (metadata.github as string) || "",
								linkedin: (metadata.linkedin as string) || "",
								summary: (metadata.summary as string) || "",
								skills: (metadata.skills as string[]) || [],
								createdAt:
									(metadata.createdAt as string) || new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							},
							content: {
								education: (content.education as unknown[]) || [],
								experience: (content.experience as unknown[]) || [],
								projects: (content.projects as unknown[]) || [],
								certifications: (content.certifications as unknown[]) || [],
								awards: (content.awards as unknown[]) || [],
							},
						}

						await createOrUpdateFile({
							path: "data/resume.json",
							content: JSON.stringify(resumeData, null, 2),
							message: generateCommitMessage(
								item.action,
								"resume",
								(metadata.name as string) || "简历",
							),
						})
						results.push({ id: item.id, success: true })
					}
				} catch (itemError) {
					results.push({
						id: item.id,
						success: false,
						error:
							itemError instanceof Error ? itemError.message : "Unknown error",
					})
				}
			}

			const successCount = results.filter((r) => r.success).length
			const failCount = results.filter((r) => !r.success).length

			res.json({
				success: failCount === 0,
				message: `同步完成: ${successCount} 成功, ${failCount} 失败`,
				results,
			})
		} catch (error) {
			console.error("Error syncing:", error)
			res.status(500).json({ success: false, error: "Sync failed" })
		}
	},
)

export default router
