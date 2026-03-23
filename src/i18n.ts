import { createI18n } from "vue-i18n"
import zhCN from "./locales/zh-CN.json"
import enUS from "./locales/en-US.json"

const getInitialLocale = () => {
	const saved = typeof localStorage !== "undefined" ? localStorage.getItem("locale") : null
	if (saved === "zh-CN" || saved === "en-US") return saved
	const navLang = typeof navigator !== "undefined" ? navigator.language : "zh-CN"
	return navLang.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US"
}

const i18n = createI18n({
	legacy: false, // 使用 Composition API
	locale: getInitialLocale(),
	fallbackLocale: "en-US",
	messages: {
		"zh-CN": zhCN,
		"en-US": enUS,
	},
})

if (typeof document !== "undefined") {
	document.documentElement.lang = String(i18n.global.locale.value)
}

export default i18n
