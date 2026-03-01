export interface User {
	id: string
	username: string
	password?: string
	role: "admin" | "user"
}

export type OperationStatus =
	| "draft"
	| "pending"
	| "syncing"
	| "published"
	| "trash"
	| "restoring"

export interface DocumentMetadata {
	id: string
	title: string
	slug: string
	description: string
	status: "draft" | "published"
	operationStatus?: OperationStatus
	createdAt: string
	updatedAt: string
	publishedAt?: string
	tags?: string[]
	coverImage?: string
	readingTime?: number
	author: string
	category?: string
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
	operationStatus?: OperationStatus
	createdAt: string
	updatedAt: string
}

export interface Collection {
	metadata: CollectionMetadata
	content: string
}

export interface CollectionMetadata {
	id: string
	title: string
	slug: string
	description: string
	coverImage?: string
	articles: string[]
	operationStatus?: OperationStatus
	createdAt: string
	updatedAt: string
}

export interface Resume {
	metadata: ResumeMetadata
	content: ResumeContent
}

export interface ResumeMetadata {
	id: string
	name: string
	title: string
	email: string
	phone: string
	location: string
	website?: string
	github?: string
	linkedin?: string
	summary: string
	skills: string[]
	createdAt: string
	updatedAt: string
}

export interface ResumeContent {
	education: Education[]
	experience: Experience[]
	projects: ResumeProject[]
	certifications: Certification[]
	awards: Award[]
}

export interface Education {
	id: string
	school: string
	degree: string
	major: string
	startDate: string
	endDate: string
	description: string
}

export interface Experience {
	id: string
	company: string
	position: string
	location: string
	startDate: string
	endDate: string
	description: string
}

export interface ResumeProject {
	id: string
	name: string
	description: string
	technologies: string[]
	link?: string
}

export interface Certification {
	id: string
	name: string
	issuer: string
	date: string
}

export interface Award {
	id: string
	name: string
	issuer: string
	date: string
}

export type TrashItemType = "document" | "project" | "collection"

export interface TrashItem {
	id: string
	itemId: string
	type: TrashItemType
	title: string
	deletedAt: string
	data?: {
		metadata: Record<string, unknown>
		content: string
	}
}
