import crypto from "crypto"

const GITHUB_API_BASE = "https://api.github.com"
const OWNER = process.env.GITHUB_OWNER
const REPO = process.env.GITHUB_REPO
const BRANCH = process.env.GITHUB_BRANCH || "main"
const TOKEN = process.env.GITHUB_TOKEN

interface GitHubFile {
	content: string
	path: string
	message: string
	sha?: string
}

async function getHeaders() {
	return {
		Authorization: `Bearer ${TOKEN}`,
		Accept: "application/vnd.github.v3+json",
		"Content-Type": "application/json",
	}
}

async function getFileSha(path: string): Promise<string | null> {
	if (!TOKEN || !OWNER || !REPO) return null

	try {
		const response = await fetch(
			`${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
			{
				headers: await getHeaders(),
			},
		)

		if (!response.ok) return null
		const data = await response.json()
		return data.sha
	} catch {
		return null
	}
}

export async function getFile(path: string): Promise<string | null> {
	if (!TOKEN || !OWNER || !REPO) {
		console.warn("GitHub sync not configured")
		return null
	}

	try {
		const response = await fetch(
			`${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
			{
				headers: await getHeaders(),
			},
		)

		if (!response.ok) {
			if (response.status === 404) return null
			throw new Error(`GitHub API error: ${response.status}`)
		}

		const data = await response.json()
		return Buffer.from(data.content, "base64").toString("utf-8")
	} catch (error) {
		console.error("Error fetching file from GitHub:", error)
		return null
	}
}

export async function createOrUpdateFile(file: GitHubFile): Promise<boolean> {
	if (!TOKEN || !OWNER || !REPO) {
		console.warn("GitHub sync not configured - skipping")
		return false
	}

	try {
		const sha = await getFileSha(file.path)

		const body: Record<string, unknown> = {
			message: file.message,
			content: Buffer.from(file.content).toString("base64"),
			branch: BRANCH,
		}

		if (sha) {
			body.sha = sha
		}

		const response = await fetch(
			`${GITHUB_API_BASE}/repos/${OWNER}/${REPO}/contents/${file.path}`,
			{
				method: "PUT",
				headers: await getHeaders(),
				body: JSON.stringify(body),
			},
		)

		if (!response.ok) {
			const error = await response.text()
			console.error("GitHub API error:", error)
			return false
		}

		return true
	} catch (error) {
		console.error("Error syncing to GitHub:", error)
		return false
	}
}

export function isGitHubSyncConfigured(): boolean {
	return !!(TOKEN && OWNER && REPO)
}

export function generateCommitMessage(
	action: "create" | "update" | "delete",
	type: "document" | "project" | "collection" | "resume",
	title: string,
): string {
	const timestamp = new Date().toLocaleString("zh-CN", {
		timeZone: "Asia/Shanghai",
	})
	const actionText: Record<string, string> = {
		create: "创建",
		update: "更新",
		delete: "删除",
	}
	const typeText: Record<string, string> = {
		document: "文章",
		project: "项目",
		collection: "合集",
		resume: "简历",
	}

	return `${actionText[action]} ${typeText[type]}: ${title} (${timestamp})`
}
