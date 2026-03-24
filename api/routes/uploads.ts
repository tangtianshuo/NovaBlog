import { Router, type Request, type Response } from "express"
import { getFileBuffer } from "../utils/githubSync.js"

const router = Router()

const getMimeType = (filename: string): string => {
	const ext = filename.split(".").pop()?.toLowerCase() || ""
	if (ext === "png") return "image/png"
	if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
	if (ext === "gif") return "image/gif"
	if (ext === "webp") return "image/webp"
	if (ext === "svg") return "image/svg+xml"
	if (ext === "avif") return "image/avif"
	return "application/octet-stream"
}

const isSafeFilename = (value: string) => /^[a-zA-Z0-9._-]+$/.test(value)

router.get("/:filename", async (req: Request, res: Response) => {
	try {
		const filename = String(req.params.filename || "")
		if (!isSafeFilename(filename)) {
			res.status(400).end()
			return
		}

		const filePath = `data/uploads/${filename}`
		const buffer = await getFileBuffer(filePath)
		if (!buffer) {
			res.status(404).end()
			return
		}

		res.setHeader("Content-Type", getMimeType(filename))
		res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400")
		res.status(200).send(buffer)
	} catch {
		res.status(500).end()
	}
})

export default router

