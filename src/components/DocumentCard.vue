<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Calendar, Clock, ArrowUpRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

interface DocMeta {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  tags?: string[];
  readingTime?: number;
  coverImage?: string;
}

const props = defineProps<{
  doc: DocMeta
}>();

const router = useRouter()
const { t, locale } = useI18n()

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const navigateToDoc = () => {
  router.push(`/doc/${props.doc.id}`)
}
</script>

<template>
  <article
    @click="navigateToDoc"
    class="group cursor-pointer rounded-2xl border border-base-border bg-base-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-neon hover:border-cyber-neon"
  >
    <div class="flex flex-col gap-3">
      <div v-if="doc.coverImage" class="overflow-hidden rounded-xl border border-base-border">
        <img :src="doc.coverImage" class="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center text-xs text-base-muted gap-3">
          <span class="inline-flex items-center gap-1">
            <Calendar class="w-3.5 h-3.5" />
            {{ formatDate(doc.createdAt) }}
          </span>
          <span v-if="doc.readingTime" class="inline-flex items-center gap-1">
            <Clock class="w-3.5 h-3.5" />
            {{ doc.readingTime }} {{ t('doc.minRead') }}
          </span>
        </div>
        <ArrowUpRight class="w-4 h-4 text-base-muted transition group-hover:text-base-text" />
      </div>

      <h3 class="text-base md:text-lg font-semibold tracking-tight text-base-text">
        {{ doc.title }}
      </h3>
      <p class="text-sm text-base-muted line-clamp-3 leading-relaxed">
        {{ doc.description }}
      </p>

      <div v-if="doc.tags?.length" class="flex flex-wrap gap-2 pt-1">
        <span
          v-for="tag in doc.tags"
          :key="tag"
          class="rounded-full border border-base-border bg-base-bg px-2.5 py-1 text-xs font-medium text-base-muted"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </article>
</template>
