<script setup lang="ts">
type OperationStatus =
	| "draft"
	| "pending"
	| "syncing"
	| "published"
	| "trash"
	| "restoring"

const props = defineProps<{
	status: OperationStatus
	showIcon?: boolean
}>()

const statusConfig: Record<OperationStatus, { icon: string; label: string; class: string }> = {
	draft: { icon: "📝", label: "草稿", class: "bg-yellow-500 text-black" },
	pending: { icon: "⏳", label: "待同步", class: "bg-blue-500 text-black" },
	syncing: { icon: "🔄", label: "同步中", class: "bg-blue-600 text-white animate-pulse" },
	published: { icon: "✅", label: "已发布", class: "bg-cyber-green text-black" },
	trash: { icon: "🗑️", label: "回收站", class: "bg-red-500 text-white" },
	restoring: { icon: "♻️", label: "恢复中", class: "bg-purple-500 text-white animate-pulse" }
}

const config = statusConfig[props.status] || statusConfig.draft
</script>

<template>
	<span
		class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold"
		:class="config.class"
	>
		<span v-if="showIcon" class="text-sm">{{ config.icon }}</span>
		{{ config.label }}
	</span>
</template>
