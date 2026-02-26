import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// __dirname is api/routes. Project root is ../../
const rootDir = path.resolve(__dirname, "../../")
const uploadDir = path.join(rootDir, "uploads")

if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadDir)
	},
	filename: function (req, file, cb) {
		// preserve extension
		const ext = path.extname(file.originalname)
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
		cb(null, uniqueSuffix + ext)
	},
})

const upload = multer({
	storage: storage,
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

	// Return URL. Since we serve 'uploads' directory at root '/uploads',
	// the URL is /uploads/filename
	const url = `/uploads/${req.file.filename}`

	res.json({
		success: true,
		url,
		data: {
			url,
		},
	})
})

export default router
