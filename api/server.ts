/**
 * local server entry file, for local development
 */
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "../")

dotenv.config({ path: path.resolve(rootDir, ".env") })

const app = (await import('./app.js')).default

const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received")
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT signal received")
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

export default app