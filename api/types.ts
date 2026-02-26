export interface User {
	id: string
	username: string
	password?: string
	role: "admin" | "user"
}

export interface DocumentMetadata {
	id: string
	title: string
	slug: string
	description: string
	status: "draft" | "published"
	createdAt: string
	updatedAt: string
	publishedAt?: string
	tags?: string[]
	coverImage?: string
	readingTime?: number
	author: string
	category?: string // Represents the folder path relative to status folder
}

export interface Document {
	metadata: DocumentMetadata
	content: string
}

export interface Project {
	metadata: ProjectMetadata
	content: string
}

export interface ProjectMetadata {
	id: string
	title: string
	slug: string
	description: string
	imageUrl: string
	link?: string
	tags: string[]
	createdAt: string
	updatedAt: string
}
