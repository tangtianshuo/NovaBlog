export const withBaseUrl = (assetPath: string) => {
	const base = import.meta.env.BASE_URL || "/"
	const cleanBase = base.endsWith("/") ? base : `${base}/`
	const cleanPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath
	return `${cleanBase}${cleanPath}`
}

