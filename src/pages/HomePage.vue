<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ProjectCard from '@/components/ProjectCard.vue';
import DocumentCard from '@/components/DocumentCard.vue';
import type { DocumentMetadata } from '../../api/types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const documents = ref<DocumentMetadata[]>([]);
const loading = ref(true);

const projects = computed(() => [
  {
    title: t('projects.neonGenesis.title'),
    description: t('projects.neonGenesis.desc'),
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=futuristic%20city%20generator%20interface%20cyberpunk&image_size=landscape_16_9',
    tags: ['WebGL', 'Vue', 'Three.js'],
    link: '#'
  },
  {
    title: t('projects.cyberDeck.title'),
    description: t('projects.cyberDeck.desc'),
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cyberpunk%20hacking%20station%20interface&image_size=landscape_16_9',
    tags: ['React', 'Electron', 'Node.js'],
    link: '#'
  },
  {
    title: t('projects.neuralLink.title'),
    description: t('projects.neuralLink.desc'),
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=brain%20computer%20interface%20dashboard%20cyberpunk&image_size=landscape_16_9',
    tags: ['D3.js', 'TypeScript', 'WebSockets'],
    link: '#'
  }
]);

onMounted(async () => {
  try {
    const res = await fetch('/api/documents?status=published');
    const data = await res.json();
    if (data.success) {
      documents.value = data.data;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-cyber-dark text-white font-sans">
    <!-- Hero Section -->
    <header class="relative h-[60vh] flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-[url('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cyberpunk%20city%20night%20rain%20neon&image_size=landscape_16_9')] bg-cover bg-center opacity-30"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-transparent to-cyber-dark"></div>
      
      <div class="relative z-10 text-center px-4">
        <h1 class="text-5xl md:text-7xl font-bold mb-4 font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-pink via-cyber-neon to-cyber-green animate-pulse">
          {{ t('home.title') }}
        </h1>
        <p class="text-xl md:text-2xl text-cyber-neon font-mono mb-8 typing-effect">
          {{ t('home.subtitle') }}
        </p>
        <div class="flex justify-center gap-4">
          <a href="#projects" class="px-6 py-2 border border-cyber-pink text-cyber-pink hover:bg-cyber-pink hover:text-black transition-all font-mono">
            {{ t('home.viewProjects') }}
          </a>
          <a href="#blog" class="px-6 py-2 border border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-black transition-all font-mono">
            {{ t('home.readDocs') }}
          </a>
        </div>
      </div>
    </header>

    <!-- Projects Section -->
    <section id="projects" class="py-20 container mx-auto px-4">
      <h2 class="text-3xl font-bold mb-12 text-center text-cyber-neon font-mono relative inline-block left-1/2 transform -translate-x-1/2">
        <span class="absolute -inset-1 bg-cyber-neon blur opacity-20"></span>
        {{ t('home.projectArchive') }}
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProjectCard 
          v-for="project in projects" 
          :key="project.title"
          v-bind="project"
        />
      </div>
    </section>

    <!-- Blog Section -->
    <section id="blog" class="py-20 bg-black bg-opacity-50">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold mb-12 text-center text-cyber-pink font-mono relative inline-block left-1/2 transform -translate-x-1/2">
           <span class="absolute -inset-1 bg-cyber-pink blur opacity-20"></span>
           {{ t('home.dataLogs') }}
        </h2>
        
        <div v-if="loading" class="text-center text-cyber-green font-mono">
          {{ t('home.loading') }}
        </div>
        
        <div v-else-if="documents.length === 0" class="text-center text-gray-500 font-mono">
          {{ t('home.noData') }}
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <DocumentCard 
            v-for="doc in documents" 
            :key="doc.id"
            :doc="doc"
          />
        </div>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="py-8 border-t border-cyber-primary text-center text-gray-500 font-mono text-xs">
      <p>{{ t('home.footer') }}</p>
    </footer>
  </div>
</template>

<style scoped>
.typing-effect {
  border-right: 2px solid #39ff14;
  white-space: nowrap;
  overflow: hidden;
  animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
  display: inline-block;
}

@keyframes typing {
  from { width: 0 }
  to { width: 100% }
}

@keyframes blink-caret {
  from, to { border-color: transparent }
  50% { border-color: #39ff14; }
}
</style>