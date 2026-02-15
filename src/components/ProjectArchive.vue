<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ProjectCard from './ProjectCard.vue';
import type { ProjectMetadata } from '../../api/types';

defineProps<{
  projects: ProjectMetadata[];
}>();

const containerRef = ref<HTMLElement | null>(null);
const isPaused = ref(false);

const scrollLeft = () => {
  if (containerRef.value) {
    containerRef.value.scrollBy({ left: -300, behavior: 'smooth' });
  }
};

const scrollRight = () => {
  if (containerRef.value) {
    containerRef.value.scrollBy({ left: 300, behavior: 'smooth' });
  }
};

const toggleAutoScroll = () => {
  isPaused.value = !isPaused.value;
};

let scrollInterval: number | null = null;

const startAutoScroll = () => {
  if (scrollInterval) return;
  
  scrollInterval = window.setInterval(() => {
    if (!isPaused.value && containerRef.value) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.value;
      
      if (scrollLeft >= scrollWidth - clientWidth) {
        containerRef.value.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        containerRef.value.scrollBy({ left: 2, behavior: 'auto' });
      }
    }
  }, 50);
};

const stopAutoScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
};

onMounted(() => {
  startAutoScroll();
});

onUnmounted(() => {
  stopAutoScroll();
});
</script>

<template>
  <div class="project-archive">
    <div class="archive-header">
      <h2 class="archive-title">项目归档</h2>
      <div class="archive-controls">
        <button 
          @click="scrollLeft" 
          class="archive-btn archive-btn-left"
          :class="{ 'paused': isPaused }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 19l-7-7 7 7" />
            <path d="M19 12H5" />
          </svg>
        </button>
        <button 
          @click="toggleAutoScroll" 
          class="archive-btn archive-btn-pause"
          :class="{ 'active': !isPaused }"
        >
          <svg v-if="!isPaused" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 19 21" />
          </svg>
        </button>
        <button 
          @click="scrollRight" 
          class="archive-btn archive-btn-right"
          :class="{ 'paused': isPaused }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5l7 7-7 7" />
            <path d="M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
    
    <div 
      ref="containerRef"
      class="archive-container"
      @mouseenter="isPaused = true"
      @mouseleave="isPaused = false"
    >
      <div class="archive-content">
        <div v-for="project in projects" :key="project.id" class="archive-item">
          <ProjectCard 
            :title="project.title"
            :description="project.description"
            :image="project.imageUrl"
            :link="project.link"
            :tags="project.tags"
            :project-id="project.id"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-archive {
  position: relative;
  padding: 20px 0;
  overflow: hidden;
}

.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.archive-title {
  font-family: 'Courier New', Courier, monospace;
  font-size: 24px;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  margin: 0;
}

.archive-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.archive-btn {
  width: 40px;
  height: 40px;
  background: rgba(0, 255, 255, 0.1);
  border: 2px solid #00ffff;
  border-radius: 4px;
  color: #00ffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.archive-btn:hover:not(.paused) {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
  transform: scale(1.1);
}

.archive-btn.paused {
  opacity: 0.5;
}

.archive-btn-pause.active {
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
}

.archive-btn svg {
  width: 20px;
  height: 20px;
}

.archive-container {
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 0 20px;
}

.archive-container::-webkit-scrollbar {
  display: none;
}

.archive-content {
  display: flex;
  gap: 20px;
  padding: 10px 0;
}

.archive-item {
  flex: 0 0 auto;
  width: 350px;
  max-width: 350px;
}

.archive-item:hover {
  transform: scale(1.02);
  transition: transform 0.3s ease;
}
</style>
