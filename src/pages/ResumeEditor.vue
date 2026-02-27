<script setup lang="ts">
	import { ref, onMounted, computed } from "vue"
	import { useAuthStore } from "@/stores/auth"
	import { useRouter } from "vue-router"
	import { useCyberToast } from "@/composables/useCyberToast"
	import { apiFetch } from "@/utils/api"
	import { useI18n } from "vue-i18n"
	import {
		Save,
		Download,
		Plus,
		Trash2,
		User,
		Mail,
		Phone,
		MapPin,
		Globe,
		Github,
		Linkedin,
		Briefcase,
		GraduationCap,
		Code,
		Award,
		FileText,
		Eye,
		EyeOff,
	} from "lucide-vue-next"
	import { jsPDF } from "jspdf"

	interface Education {
		id: string
		school: string
		degree: string
		major: string
		startDate: string
		endDate: string
		description: string
	}

	interface Experience {
		id: string
		company: string
		position: string
		location: string
		startDate: string
		endDate: string
		description: string
	}

	interface ResumeProject {
		id: string
		name: string
		description: string
		technologies: string
		link: string
	}

	interface Certification {
		id: string
		name: string
		issuer: string
		date: string
	}

	interface Award {
		id: string
		name: string
		issuer: string
		date: string
	}

	interface ResumeMetadata {
		id: string
		name: string
		title: string
		email: string
		phone: string
		location: string
		website: string
		github: string
		linkedin: string
		summary: string
		skills: string
	}

	interface ResumeContent {
		education: Education[]
		experience: Experience[]
		projects: ResumeProject[]
		certifications: Certification[]
		awards: Award[]
	}

	const router = useRouter()
	const authStore = useAuthStore()
	const { t } = useI18n()
	const { success, error } = useCyberToast()

	const isAuthenticated = computed(() => authStore.isAuthenticated)

	const loading = ref(false)
	const saving = ref(false)
	const exporting = ref(false)
	const activeTab = ref("basic")
	const previewMode = ref(!authStore.isAuthenticated)

	const metadata = ref<ResumeMetadata>({
		id: "",
		name: "",
		title: "",
		email: "",
		phone: "",
		location: "",
		website: "",
		github: "",
		linkedin: "",
		summary: "",
		skills: "",
	})

	const content = ref<ResumeContent>({
		education: [],
		experience: [],
		projects: [],
		certifications: [],
		awards: [],
	})

	const generateId = () => Math.random().toString(36).substring(2, 15)

	const addEducation = () => {
		content.value.education.push({
			id: generateId(),
			school: "",
			degree: "",
			major: "",
			startDate: "",
			endDate: "",
			description: "",
		})
	}

	const removeEducation = (index: number) => {
		content.value.education.splice(index, 1)
	}

	const addExperience = () => {
		content.value.experience.push({
			id: generateId(),
			company: "",
			position: "",
			location: "",
			startDate: "",
			endDate: "",
			description: "",
		})
	}

	const removeExperience = (index: number) => {
		content.value.experience.splice(index, 1)
	}

	const addProject = () => {
		content.value.projects.push({
			id: generateId(),
			name: "",
			description: "",
			technologies: "",
			link: "",
		})
	}

	const removeProject = (index: number) => {
		content.value.projects.splice(index, 1)
	}

	const addCertification = () => {
		content.value.certifications.push({
			id: generateId(),
			name: "",
			issuer: "",
			date: "",
		})
	}

	const removeCertification = (index: number) => {
		content.value.certifications.splice(index, 1)
	}

	const addAward = () => {
		content.value.awards.push({
			id: generateId(),
			name: "",
			issuer: "",
			date: "",
		})
	}

	const removeAward = (index: number) => {
		content.value.awards.splice(index, 1)
	}

	const fetchResume = async () => {
		loading.value = true
		try {
			const res = await apiFetch("/resume")
			const data = await res.json()
			if (data.success && data.data) {
				metadata.value = {
					...data.data.metadata,
					skills: data.data.metadata.skills?.join(", ") || "",
				}
				content.value = data.data.content
			} else {
				addEducation()
				addExperience()
			}
		} catch (e) {
			error(t("resume.loadError"))
		} finally {
			loading.value = false
		}
	}

	const saveResume = async () => {
		if (!metadata.value.name) {
			error(t("resume.nameRequired"))
			return
		}

		saving.value = true
		try {
			const payload = {
				metadata: {
					...metadata.value,
					skills: metadata.value.skills
						.split(",")
						.map((s) => s.trim())
						.filter((s) => s),
				},
				content: content.value,
			}

			const res = await apiFetch("/resume", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authStore.token}`,
				},
				body: JSON.stringify(payload),
			})

			const data = await res.json()
			if (data.success) {
				success(t("resume.saved"))
			} else {
				error(data.error || t("resume.saveError"))
			}
		} catch (e) {
			error(t("resume.saveError"))
		} finally {
			saving.value = false
		}
	}

	const exportToPdf = async () => {
		exporting.value = true
		try {
			const doc = new jsPDF({
				orientation: "portrait",
				unit: "mm",
				format: "a4",
			})

			const pageWidth = doc.internal.pageSize.getWidth()
			const pageHeight = doc.internal.pageSize.getHeight()
			const margin = 15
			const contentWidth = pageWidth - margin * 2
			let yPosition = margin

			const addNewPageIfNeeded = (neededHeight: number) => {
				if (yPosition + neededHeight > pageHeight - margin) {
					doc.addPage()
					yPosition = margin
				}
			}

			doc.setFontSize(24)
			doc.setFont("helvetica", "bold")
			doc.text(metadata.value.name || "Resume", pageWidth / 2, yPosition, { align: "center" })
			yPosition += 10

			doc.setFontSize(14)
			doc.setFont("helvetica", "normal")
			doc.text(metadata.value.title || "", pageWidth / 2, yPosition, { align: "center" })
			yPosition += 10

			doc.setFontSize(10)
			doc.setFont("helvetica", "normal")
			const contactInfo: string[] = []
			if (metadata.value.email) contactInfo.push(metadata.value.email)
			if (metadata.value.phone) contactInfo.push(metadata.value.phone)
			if (metadata.value.location) contactInfo.push(metadata.value.location)
			if (metadata.value.website) contactInfo.push(metadata.value.website)
			if (metadata.value.github) contactInfo.push(`GitHub: ${metadata.value.github}`)
			if (metadata.value.linkedin) contactInfo.push(`LinkedIn: ${metadata.value.linkedin}`)
			doc.text(contactInfo.join(" | "), pageWidth / 2, yPosition, { align: "center" })
			yPosition += 10

			doc.setDrawColor(200)
			doc.line(margin, yPosition, pageWidth - margin, yPosition)
			yPosition += 8

			if (metadata.value.summary) {
				doc.setFontSize(12)
				doc.setFont("helvetica", "bold")
				doc.text("Summary", margin, yPosition)
				yPosition += 6
				doc.setFontSize(10)
				doc.setFont("helvetica", "normal")
				const summaryLines = doc.splitTextToSize(metadata.value.summary, contentWidth)
				doc.text(summaryLines, margin, yPosition)
				yPosition += summaryLines.length * 5 + 5
			}

			if (skillsArray.value.length > 0) {
				addNewPageIfNeeded(20)
				doc.setFontSize(12)
				doc.setFont("helvetica", "bold")
				doc.text("Skills", margin, yPosition)
				yPosition += 6
				doc.setFontSize(10)
				doc.setFont("helvetica", "normal")
				doc.text(skillsArray.value.join(", "), margin, yPosition)
				yPosition += 10
			}

			if (content.value.experience.length > 0) {
				addNewPageIfNeeded(30)
				doc.setFontSize(12)
				doc.setFont("helvetica", "bold")
				doc.text("Experience", margin, yPosition)
				yPosition += 6

				for (const exp of content.value.experience) {
					addNewPageIfNeeded(25)
					doc.setFontSize(11)
					doc.setFont("helvetica", "bold")
					doc.text(exp.position, margin, yPosition)
					const dateStr = `${exp.startDate} - ${exp.endDate || "Present"}`
					doc.setFontSize(9)
					doc.setFont("helvetica", "normal")
					doc.text(dateStr, pageWidth - margin, yPosition, { align: "right" })
					yPosition += 5

					doc.setFontSize(10)
					doc.text(exp.company + (exp.location ? ` - ${exp.location}` : ""), margin, yPosition)
					yPosition += 5

					if (exp.description) {
						const descLines = doc.splitTextToSize(exp.description, contentWidth)
						doc.text(descLines, margin, yPosition)
						yPosition += descLines.length * 4 + 5
					}
					yPosition += 3
				}
			}

			if (content.value.education.length > 0) {
				addNewPageIfNeeded(30)
				doc.setFontSize(12)
				doc.setFont("helvetica", "bold")
				doc.text("Education", margin, yPosition)
				yPosition += 6

				for (const edu of content.value.education) {
					addNewPageIfNeeded(20)
					doc.setFontSize(11)
					doc.setFont("helvetica", "bold")
					doc.text(edu.school, margin, yPosition)
					const dateStr = `${edu.startDate} - ${edu.endDate || "Present"}`
					doc.setFontSize(9)
					doc.setFont("helvetica", "normal")
					doc.text(dateStr, pageWidth - margin, yPosition, { align: "right" })
					yPosition += 5

					doc.setFontSize(10)
					doc.text(`${edu.degree} in ${edu.major}`, margin, yPosition)
					yPosition += 5

					if (edu.description) {
						const descLines = doc.splitTextToSize(edu.description, contentWidth)
						doc.text(descLines, margin, yPosition)
						yPosition += descLines.length * 4 + 5
					}
					yPosition += 3
				}
			}

			if (content.value.projects.length > 0) {
				addNewPageIfNeeded(25)
				doc.setFontSize(12)
				doc.setFont("helvetica", "bold")
				doc.text("Projects", margin, yPosition)
				yPosition += 6

				for (const proj of content.value.projects) {
					addNewPageIfNeeded(20)
					doc.setFontSize(11)
					doc.setFont("helvetica", "bold")
					doc.text(proj.name, margin, yPosition)
					yPosition += 5

					doc.setFontSize(10)
					if (proj.description) {
						const descLines = doc.splitTextToSize(proj.description, contentWidth)
						doc.text(descLines, margin, yPosition)
						yPosition += descLines.length * 4 + 3
					}
					if (proj.technologies) {
						doc.setFontSize(9)
						doc.setTextColor(100)
						doc.text(`Technologies: ${proj.technologies}`, margin, yPosition)
						doc.setTextColor(0)
						yPosition += 4
					}
					yPosition += 2
				}
			}

			if (content.value.certifications.length > 0) {
				addNewPageIfNeeded(20)
				doc.setFontSize(12)
				doc.setFont("helvetica", "bold")
				doc.text("Certifications", margin, yPosition)
				yPosition += 6

				for (const cert of content.value.certifications) {
					doc.setFontSize(10)
					doc.setFont("helvetica", "normal")
					doc.text(cert.name, margin, yPosition)
					doc.text(`${cert.issuer} - ${cert.date}`, pageWidth - margin, yPosition, { align: "right" })
					yPosition += 5
				}
			}

			if (content.value.awards.length > 0) {
				addNewPageIfNeeded(20)
				yPosition += 3
				doc.setFontSize(12)
				doc.setFont("helvetica", "bold")
				doc.text("Awards", margin, yPosition)
				yPosition += 6

				for (const award of content.value.awards) {
					doc.setFontSize(10)
					doc.setFont("helvetica", "normal")
					doc.text(award.name, margin, yPosition)
					doc.text(`${award.issuer} - ${award.date}`, pageWidth - margin, yPosition, { align: "right" })
					yPosition += 5
				}
			}

			doc.save(`${metadata.value.name || "resume"}_resume.pdf`)
			success(t("resume.exported"))
		} catch (e) {
			console.error(e)
			error(t("resume.exportError"))
		} finally {
			exporting.value = false
		}
	}

	const tabs = [
		{ id: "basic", label: "resume.tabBasic", icon: User },
		{ id: "experience", label: "resume.tabExperience", icon: Briefcase },
		{ id: "education", label: "resume.tabEducation", icon: GraduationCap },
		{ id: "projects", label: "resume.tabProjects", icon: Code },
		{ id: "skills", label: "resume.tabSkills", icon: Award },
		{ id: "certifications", label: "resume.tabCertifications", icon: FileText },
		{ id: "awards", label: "resume.tabAwards", icon: Award },
	]

	const skillsArray = computed(() => {
		return metadata.value.skills
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s)
	})

	onMounted(() => {
		fetchResume()
	})
</script>

<template>
	<div class="flex h-screen bg-cyber-dark text-white pt-16 overflow-hidden">
		<aside v-if="isAuthenticated" class="w-64 border-r border-cyber-primary flex flex-col bg-black bg-opacity-50 flex-shrink-0">
			<div class="p-4 border-b border-cyber-primary">
				<h2 class="font-mono text-cyber-neon font-bold">{{ t("resume.title") }}</h2>
			</div>
			<nav class="flex-1 overflow-y-auto p-2">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					@click="activeTab = tab.id"
					class="w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors mb-1"
					:class="activeTab === tab.id ? 'bg-cyber-primary text-cyber-neon' : 'hover:bg-cyber-primary hover:text-white text-gray-400'"
				>
					<component :is="tab.icon" class="w-4 h-4" />
					<span class="text-sm font-mono">{{ t(tab.label) }}</span>
				</button>
			</nav>
		</aside>

		<main class="flex-1 flex flex-col min-w-0 overflow-hidden">
			<div class="border-b px-4 py-2 flex items-center justify-between bg-cyber-neon bg-opacity-20 border-cyber-neon">
				<span class="text-xs font-mono font-bold text-cyber-neon">{{ isAuthenticated ? 'RESUME EDITOR' : 'MY RESUME' }}</span>
				<div class="flex items-center gap-2">
					<template v-if="isAuthenticated">
						<button
							@click="previewMode = !previewMode"
							class="flex items-center gap-1 px-3 py-1.5 text-xs font-mono rounded transition-all"
							:class="previewMode ? 'bg-cyber-pink text-black' : 'bg-cyber-dark border border-cyber-pink text-cyber-pink hover:bg-cyber-pink hover:text-black'"
						>
							<component :is="previewMode ? EyeOff : Eye" class="w-4 h-4" />
							{{ previewMode ? t("resume.editMode") : t("resume.previewMode") }}
						</button>
						<button
							@click="saveResume"
							:disabled="saving"
							class="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-cyber-dark border border-cyber-pink text-cyber-pink rounded hover:bg-cyber-pink hover:text-black transition-all"
						>
							<Save class="w-4 h-4" />
							{{ saving ? t("resume.saving") : t("resume.save") }}
						</button>
						<button
							@click="exportToPdf"
							:disabled="exporting"
							class="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-cyber-dark border border-cyber-green text-cyber-green rounded hover:bg-cyber-green hover:text-black transition-all"
						>
							<Download class="w-4 h-4" />
							{{ exporting ? t("resume.exporting") : t("resume.exportPdf") }}
						</button>
					</template>
					<template v-else>
						<span class="text-xs font-mono text-cyber-green border border-cyber-green px-2 py-1 rounded">{{ t('resume.readOnly') || 'Read Only' }}</span>
					</template>
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-6" v-if="!loading">
				<div v-if="previewMode" class="max-w-4xl mx-auto bg-cyber-dark border border-cyber-neon p-8 rounded-lg shadow-lg shadow-cyber-neon/20 relative overflow-hidden">
				<div class="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
				<div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyber-neon via-cyber-primary to-cyber-neon opacity-50"></div>
				<div id="resume-preview" class="relative z-10">
					<header class="text-center border-b-2 border-cyber-neon pb-4 mb-6">
						<h1 class="text-3xl font-bold text-cyber-neon drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">{{ metadata.name || "Your Name" }}</h1>
						<p class="text-xl text-cyber-primary mt-1">{{ metadata.title || "Professional Title" }}</p>
						<div class="flex flex-wrap justify-center gap-4 mt-3 text-sm text-cyber-green">
								<span v-if="metadata.email" class="flex items-center gap-1">
									<Mail class="w-4 h-4" /> {{ metadata.email }}
								</span>
								<span v-if="metadata.phone" class="flex items-center gap-1">
									<Phone class="w-4 h-4" /> {{ metadata.phone }}
								</span>
								<span v-if="metadata.location" class="flex items-center gap-1">
									<MapPin class="w-4 h-4" /> {{ metadata.location }}
								</span>
								<span v-if="metadata.website" class="flex items-center gap-1">
									<Globe class="w-4 h-4" /> {{ metadata.website }}
								</span>
								<span v-if="metadata.github" class="flex items-center gap-1">
									<Github class="w-4 h-4" /> {{ metadata.github }}
								</span>
								<span v-if="metadata.linkedin" class="flex items-center gap-1">
									<Linkedin class="w-4 h-4" /> {{ metadata.linkedin }}
								</span>
							</div>
						</header>

						<section v-if="metadata.summary" class="mb-6">
							<h2 class="text-lg font-bold border-b border-cyber-neon pb-1 mb-3 text-cyber-neon font-mono">Summary</h2>
							<p class="text-gray-300 whitespace-pre-line">{{ metadata.summary }}</p>
						</section>

						<section v-if="skillsArray.length > 0" class="mb-6">
							<h2 class="text-lg font-bold border-b border-cyber-neon pb-1 mb-3 text-cyber-neon font-mono">Skills</h2>
							<div class="flex flex-wrap gap-2">
								<span
									v-for="skill in skillsArray"
									:key="skill"
									class="px-3 py-1 bg-cyber-dark border border-cyber-primary text-cyber-neon text-sm rounded font-mono"
								>
									{{ skill }}
								</span>
							</div>
						</section>

						<section v-if="content.experience.length > 0" class="mb-6">
							<h2 class="text-lg font-bold border-b border-cyber-neon pb-1 mb-3 text-cyber-neon font-mono">Experience</h2>
							<div v-for="exp in content.experience" :key="exp.id" class="mb-4 pl-3 border-l-2 border-cyber-primary">
								<div class="flex justify-between items-start">
									<div>
										<h3 class="font-semibold text-cyber-neon">{{ exp.position }}</h3>
										<p class="text-cyber-primary">{{ exp.company }} <span v-if="exp.location">- {{ exp.location }}</span></p>
									</div>
									<span class="text-sm text-cyber-green font-mono">{{ exp.startDate }} - {{ exp.endDate || "Present" }}</span>
								</div>
								<p class="text-gray-300 mt-2 whitespace-pre-line">{{ exp.description }}</p>
							</div>
						</section>

						<section v-if="content.education.length > 0" class="mb-6">
							<h2 class="text-lg font-bold border-b border-cyber-neon pb-1 mb-3 text-cyber-neon font-mono">Education</h2>
							<div v-for="edu in content.education" :key="edu.id" class="mb-4 pl-3 border-l-2 border-cyber-primary">
								<div class="flex justify-between items-start">
									<div>
										<h3 class="font-semibold text-cyber-neon">{{ edu.school }}</h3>
										<p class="text-cyber-primary">{{ edu.degree }} in {{ edu.major }}</p>
									</div>
									<span class="text-sm text-cyber-green font-mono">{{ edu.startDate }} - {{ edu.endDate || "Present" }}</span>
								</div>
								<p class="text-gray-300 mt-2 whitespace-pre-line">{{ edu.description }}</p>
							</div>
						</section>

						<section v-if="content.projects.length > 0" class="mb-6">
							<h2 class="text-lg font-bold border-b border-cyber-neon pb-1 mb-3 text-cyber-neon font-mono">Projects</h2>
							<div v-for="proj in content.projects" :key="proj.id" class="mb-4 pl-3 border-l-2 border-cyber-pink">
								<h3 class="font-semibold text-cyber-pink">
									{{ proj.name }}
									<span v-if="proj.link" class="text-cyber-neon text-sm font-normal"> - {{ proj.link }}</span>
								</h3>
								<p class="text-gray-300 mt-1">{{ proj.description }}</p>
								<p v-if="proj.technologies" class="text-cyber-green text-sm mt-1 font-mono">Technologies: {{ proj.technologies }}</p>
							</div>
						</section>

						<section v-if="content.certifications.length > 0" class="mb-6">
							<h2 class="text-lg font-bold border-b border-cyber-neon pb-1 mb-3 text-cyber-neon font-mono">Certifications</h2>
							<div v-for="cert in content.certifications" :key="cert.id" class="mb-2 pl-3 border-l-2 border-cyber-green flex justify-between">
								<span class="text-cyber-neon">{{ cert.name }}</span>
								<span class="text-cyber-primary">{{ cert.issuer }} - {{ cert.date }}</span>
							</div>
						</section>

						<section v-if="content.awards.length > 0" class="mb-6">
							<h2 class="text-lg font-bold border-b border-cyber-neon pb-1 mb-3 text-cyber-neon font-mono">Awards</h2>
							<div v-for="award in content.awards" :key="award.id" class="mb-2 pl-3 border-l-2 border-cyber-yellow flex justify-between">
								<span class="text-cyber-neon">{{ award.name }}</span>
								<span class="text-cyber-primary">{{ award.issuer }} - {{ award.date }}</span>
							</div>
						</section>
					</div>
				</div>

				<div v-else class="max-w-4xl mx-auto space-y-6">
					<div v-show="activeTab === 'basic'" class="space-y-4">
						<h3 class="text-lg font-mono text-cyber-neon">{{ t("resume.basicInfo") }}</h3>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm text-gray-500 mb-1">{{ t("resume.name") }} *</label>
								<input v-model="metadata.name" type="text" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
							<div>
								<label class="block text-sm text-gray-500 mb-1">{{ t("resume.title") }}</label>
								<input v-model="metadata.title" type="text" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
							<div>
								<label class="block text-sm text-gray-500 mb-1">{{ t("resume.email") }}</label>
								<input v-model="metadata.email" type="email" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
							<div>
								<label class="block text-sm text-gray-500 mb-1">{{ t("resume.phone") }}</label>
								<input v-model="metadata.phone" type="tel" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
							<div>
								<label class="block text-sm text-gray-500 mb-1">{{ t("resume.location") }}</label>
								<input v-model="metadata.location" type="text" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
							<div>
								<label class="block text-sm text-gray-500 mb-1">{{ t("resume.website") }}</label>
								<input v-model="metadata.website" type="url" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
							<div>
								<label class="block text-sm text-gray-500 mb-1">{{ t("resume.github") }}</label>
								<input v-model="metadata.github" type="text" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
							<div>
								<label class="block text-sm text-gray-500 mb-1">{{ t("resume.linkedin") }}</label>
								<input v-model="metadata.linkedin" type="text" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
						</div>
						<div>
							<label class="block text-sm text-gray-500 mb-1">{{ t("resume.summary") }}</label>
							<textarea v-model="metadata.summary" rows="4" class="w-full bg-transparent border border-gray-700 focus:border-cyber-neon p-2 focus:outline-none resize-none"></textarea>
						</div>
					</div>

					<div v-show="activeTab === 'skills'" class="space-y-4">
						<h3 class="text-lg font-mono text-cyber-neon">{{ t("resume.skills") }}</h3>
						<div>
							<label class="block text-sm text-gray-500 mb-1">{{ t("resume.skillsHint") }}</label>
							<textarea v-model="metadata.skills" rows="3" placeholder="JavaScript, TypeScript, Vue, React, Node.js..." class="w-full bg-transparent border border-gray-700 focus:border-cyber-neon p-2 focus:outline-none resize-none"></textarea>
						</div>
						<div v-if="skillsArray.length > 0" class="flex flex-wrap gap-2">
							<span
								v-for="skill in skillsArray"
								:key="skill"
								class="px-3 py-1 bg-cyber-primary text-cyber-neon text-sm rounded"
							>
								{{ skill }}
							</span>
						</div>
					</div>

					<div v-show="activeTab === 'experience'" class="space-y-4">
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-mono text-cyber-neon">{{ t("resume.experience") }}</h3>
							<button @click="addExperience" class="flex items-center gap-1 px-3 py-1 bg-cyber-pink text-black rounded text-sm hover:bg-cyber-pink/80">
								<Plus class="w-4 h-4" /> {{ t("resume.add") }}
							</button>
						</div>
						<div v-for="(exp, index) in content.experience" :key="exp.id" class="border border-gray-700 p-4 rounded space-y-3">
							<div class="flex justify-between">
								<h4 class="text-cyber-neon font-mono">{{ t("resume.experience") }} #{{ index + 1 }}</h4>
								<button @click="removeExperience(index)" class="text-red-500 hover:text-red-400">
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<input v-model="exp.company" :placeholder="t('resume.company')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="exp.position" :placeholder="t('resume.position')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="exp.location" :placeholder="t('resume.location')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<div class="flex gap-2">
									<input v-model="exp.startDate" :placeholder="t('resume.startDate')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none flex-1" />
									<input v-model="exp.endDate" :placeholder="t('resume.endDate')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none flex-1" />
								</div>
							</div>
							<textarea v-model="exp.description" :placeholder="t('resume.description')" rows="3" class="w-full bg-transparent border border-gray-700 focus:border-cyber-neon p-2 focus:outline-none resize-none"></textarea>
						</div>
					</div>

					<div v-show="activeTab === 'education'" class="space-y-4">
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-mono text-cyber-neon">{{ t("resume.education") }}</h3>
							<button @click="addEducation" class="flex items-center gap-1 px-3 py-1 bg-cyber-pink text-black rounded text-sm hover:bg-cyber-pink/80">
								<Plus class="w-4 h-4" /> {{ t("resume.add") }}
							</button>
						</div>
						<div v-for="(edu, index) in content.education" :key="edu.id" class="border border-gray-700 p-4 rounded space-y-3">
							<div class="flex justify-between">
								<h4 class="text-cyber-neon font-mono">{{ t("resume.education") }} #{{ index + 1 }}</h4>
								<button @click="removeEducation(index)" class="text-red-500 hover:text-red-400">
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<input v-model="edu.school" :placeholder="t('resume.school')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="edu.degree" :placeholder="t('resume.degree')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="edu.major" :placeholder="t('resume.major')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<div class="flex gap-2">
									<input v-model="edu.startDate" :placeholder="t('resume.startDate')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none flex-1" />
									<input v-model="edu.endDate" :placeholder="t('resume.endDate')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none flex-1" />
								</div>
							</div>
							<textarea v-model="edu.description" :placeholder="t('resume.description')" rows="2" class="w-full bg-transparent border border-gray-700 focus:border-cyber-neon p-2 focus:outline-none resize-none"></textarea>
						</div>
					</div>

					<div v-show="activeTab === 'projects'" class="space-y-4">
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-mono text-cyber-neon">{{ t("resume.projects") }}</h3>
							<button @click="addProject" class="flex items-center gap-1 px-3 py-1 bg-cyber-pink text-black rounded text-sm hover:bg-cyber-pink/80">
								<Plus class="w-4 h-4" /> {{ t("resume.add") }}
							</button>
						</div>
						<div v-for="(proj, index) in content.projects" :key="proj.id" class="border border-gray-700 p-4 rounded space-y-3">
							<div class="flex justify-between">
								<h4 class="text-cyber-neon font-mono">{{ t("resume.project") }} #{{ index + 1 }}</h4>
								<button @click="removeProject(index)" class="text-red-500 hover:text-red-400">
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<input v-model="proj.name" :placeholder="t('resume.projectName')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="proj.link" :placeholder="t('resume.link')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
							<textarea v-model="proj.description" :placeholder="t('resume.description')" rows="2" class="w-full bg-transparent border border-gray-700 focus:border-cyber-neon p-2 focus:outline-none resize-none"></textarea>
							<input v-model="proj.technologies" :placeholder="t('resume.technologies')" class="w-full bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
						</div>
					</div>

					<div v-show="activeTab === 'certifications'" class="space-y-4">
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-mono text-cyber-neon">{{ t("resume.certifications") }}</h3>
							<button @click="addCertification" class="flex items-center gap-1 px-3 py-1 bg-cyber-pink text-black rounded text-sm hover:bg-cyber-pink/80">
								<Plus class="w-4 h-4" /> {{ t("resume.add") }}
							</button>
						</div>
						<div v-for="(cert, index) in content.certifications" :key="cert.id" class="border border-gray-700 p-4 rounded space-y-3">
							<div class="flex justify-between">
								<h4 class="text-cyber-neon font-mono">{{ t("resume.certification") }} #{{ index + 1 }}</h4>
								<button @click="removeCertification(index)" class="text-red-500 hover:text-red-400">
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
							<div class="grid grid-cols-3 gap-3">
								<input v-model="cert.name" :placeholder="t('resume.certName')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="cert.issuer" :placeholder="t('resume.issuer')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="cert.date" :placeholder="t('resume.date')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
						</div>
					</div>

					<div v-show="activeTab === 'awards'" class="space-y-4">
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-mono text-cyber-neon">{{ t("resume.awards") }}</h3>
							<button @click="addAward" class="flex items-center gap-1 px-3 py-1 bg-cyber-pink text-black rounded text-sm hover:bg-cyber-pink/80">
								<Plus class="w-4 h-4" /> {{ t("resume.add") }}
							</button>
						</div>
						<div v-for="(award, index) in content.awards" :key="award.id" class="border border-gray-700 p-4 rounded space-y-3">
							<div class="flex justify-between">
								<h4 class="text-cyber-neon font-mono">{{ t("resume.award") }} #{{ index + 1 }}</h4>
								<button @click="removeAward(index)" class="text-red-500 hover:text-red-400">
									<Trash2 class="w-4 h-4" />
								</button>
							</div>
							<div class="grid grid-cols-3 gap-3">
								<input v-model="award.name" :placeholder="t('resume.awardName')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="award.issuer" :placeholder="t('resume.issuer')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
								<input v-model="award.date" :placeholder="t('resume.date')" class="bg-transparent border-b border-gray-700 focus:border-cyber-neon p-2 focus:outline-none" />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div v-else class="flex-1 flex items-center justify-center">
				<div class="text-cyber-neon font-mono">{{ t("resume.loading") }}</div>
			</div>
		</main>
	</div>
</template>
