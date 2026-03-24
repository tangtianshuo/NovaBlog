import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { createOrUpdateFile, isGitHubSyncConfigured } from "../utils/githubSync.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// __dirname is api/routes. Project root is ../../
const rootDir = path.resolve(__dirname, "../../")
const uploadDir = path.join(rootDir, "uploads")

const isVercel =
	process.env.VERCEL === "1" || process.env.NODE_ENV === "production"

if (!isVercel) {
	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir, { recursive: true })
	}
}

const diskStorage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir)
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname)
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
		cb(null, uniqueSuffix + ext)
	},
})

const upload = multer({
	storage: isVercel ? multer.memoryStorage() : diskStorage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith("image/")) {
			cb(null, true)
		} else {
			cb(new Error("Only images are allowed"))
		}
	},
})

const router = express.Router()

router.post("/", upload.single("file"), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ success: false, error: "No file uploaded" })
	}

	const ext = path.extname(req.file.originalname)
	const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
	const filename = `${uniqueSuffix}${ext}`

	if (isVercel) {
		if (!isGitHubSyncConfigured()) {
			return res
				.status(503)
				.json({ success: false, error: "GitHub sync not configured on Vercel" })
		}

		const buffer = (req.file as any).buffer as Buffer | undefined
		if (!buffer) {
			return res.status(400).json({ success: false, error: "Empty upload" })
		}

		createOrUpdateFile({
			path: `data/uploads/${filename}`,
			content: buffer.toString("base64"),
			encoding: "base64",
			message: `上传图片: ${filename}`,
		})
			.then((ok) => {
				if (!ok) {
					res.status(500).json({ success: false, error: "Upload failed" })
					return
				}
				const url = `/api/uploads/${filename}`
				res.json({ success: true, url, data: { url } })
			})
			.catch(() => {
				res.status(500).json({ success: false, error: "Upload failed" })
			})
		return
	}

	const savedFilename = req.file.filename || filename
	const url = `/uploads/${savedFilename}`
	res.json({ success: true, url, data: { url } })
})

export default router
