export const API_BASE =
	(typeof import.meta !== "undefined" &&
		(import.meta as any).env &&
		(import.meta as any).env.VITE_API_BASE) ||
	"/api"

const join = (base: string, path: string) => {
	const b = base.endsWith("/") ? base.slice(0, -1) : base
	const p = path.startsWith("/") ? path : `/${path}`
	return `${b}${p}`
}

export const apiUrl = (path: string) => join(API_BASE, path)

export const apiFetch = (path: string, init?: RequestInit) =>
	fetch(apiUrl(path), init)


