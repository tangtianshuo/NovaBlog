---
title: Vue 3 最佳实践指南
description: 构建 Vue 3 应用的最佳实践和模式
tags: vue, 前端, best-practices
category: 技术
status: published
created_at: 2024-02-01T09:15:00Z
updated_at: 2024-02-01T09:15:00Z
readingTime: 12
---

# Vue 3 最佳实践指南

本文档总结了 Vue 3 开发中的最佳实践，帮助您构建可维护、高性能的应用。

## Composition API

### 使用 Setup 语法

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

onMounted(() => {
  console.log('Component mounted')
})
</script>

<template>
  <div>{{ count }} × 2 = {{ doubled }}</div>
</template>
```

### 响应式数据

```typescript
// ✅ 使用 ref 用于基本类型
const count = ref(0)
const name = ref('')

// ✅ 使用 reactive 用于对象
const user = reactive({
  id: 1,
  name: '张三',
  email: 'zhang@example.com'
})

// ❌ 避免：解构 reactive 对象会失去响应性
const { id, name } = user

// ✅ 正确：使用 toRefs
const { id, name } = toRefs(user)
```

### Composables

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const increment = () => count.value++
  const decrement = () => count.value--
  const doubled = computed(() => count.value * 2)

  return { count, increment, decrement, doubled }
}
```

```vue
<script setup lang="ts">
import { useCounter } from '@/composables/useCounter'

const { count, increment, decrement, doubled } = useCounter(10)
</script>
```

## 组件设计

### 单一职责原则

每个组件应该只做一件事：

```vue
<!-- ✅ 好的做法 -->
<UserProfile :user="user" />
<UserSettings :settings="settings" />

<!-- ❌ 避免 -->
<UserProfileWithSettings :user="user" :settings="settings" />
```

### Props 验证

```typescript
interface Props {
  title: string
  count?: number
  items: Array<{ id: number; name: string }>
  onUpdate: (value: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
```

### Emits 定义

```typescript
const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
  change: [event: Event]
}>()

const handleClick = () => {
  emit('update', 'new value')
}
```

## 性能优化

### v-memo

```vue
<template>
  <div v-for="item in largeList" :key="item.id" v-memo="[item.id, item.value]">
    <ExpensiveComponent :data="item" />
  </div>
</template>
```

### 计算属性缓存

```typescript
// ✅ 使用 computed 缓存结果
const filteredList = computed(() => {
  return list.value.filter(item => item.active)
})

// ❌ 避免：每次调用都重新计算
const filterList = () => {
  return list.value.filter(item => item.active)
}
```

### 虚拟滚动

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`
}))
</script>

<template>
  <RecycleScroller
    class="scroller"
    :items="items"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <div class="item">{{ item.name }}</div>
    </template>
  </RecycleScroller>
</template>
```

## 状态管理

### Pinia Store

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  function login(userData: User) {
    user.value = userData
  }

  function logout() {
    user.value = null
  }

  return { user, isAuthenticated, login, logout }
})
```

### 使用 Store

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const { user, isAuthenticated } = storeToRefs(userStore)
</script>

<template>
  <div v-if="isAuthenticated">
    欢迎，{{ user?.name }}
  </div>
</template>
```

## 路由管理

### 路由守卫

```typescript
// router/index.ts
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})
```

### 动态路由

```typescript
const routes = [
  {
    path: '/user/:id',
    name: 'user',
    component: () => import('@/views/User.vue'),
    props: route => ({ id: route.params.id })
  }
]
```

## 类型安全

### TypeScript 集成

```typescript
// 定义 Props 类型
interface Props {
  data: UserData[]
  onSelect: (item: UserData) => void
  readonly?: boolean
}

// 使用泛型
const list = ref<Record<string, Item>>({})
const map = ref<Map<string, number>>(new Map())
```

## 样式最佳实践

### 作用域样式

```vue
<style scoped>
.local-component {
  /* 只影响当前组件 */
}

/* 使用深度选择器 */
.local-component :deep(.child-element) {
  color: red;
}
</style>
```

### CSS Modules

```vue
<style module>
.container {
  padding: 1rem;
}
</style>

<template>
  <div :class="$style.container">内容</div>
</template>
```

## 测试

### 单元测试

```typescript
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

describe('Counter', () => {
  it('increments count', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('Count: 1')
  })
})
```

### 组件测试

```typescript
import { render } from '@testing-library/vue'
import UserProfile from './UserProfile.vue'

test('displays user name', () => {
  const { getByText } = render(UserProfile, {
    props: { user: { name: '张三' } }
  })
  expect(getByText('张三')).toBeInTheDocument()
})
```

## 架构模式

### 单文件组件结构

```vue
<script setup lang="ts">
// 1. 导入依赖
import { ref, computed } from 'vue'
import { useStore } from '@/stores'

// 2. 定义 Props 和 Emits
interface Props { /* ... */ }
const props = defineProps<Props>()
const emit = defineEmits<{ /* ... */ }>()

// 3. 响应式状态
const state = ref(/* ... */)

// 4. 计算属性
const computedValue = computed(() => /* ... */)

// 5. 方法
const handleClick = () => { /* ... */ }

// 6. 生命周期
onMounted(() => { /* ... */ })
</script>

<template>
  
</template>

<style scoped>
  
</style>
```

### 目录结构推荐

```
src/
├── assets/          # 静态资源
├── components/      # 可复用组件
│   ├── base/       # 基础组件
│   └── business/   # 业务组件
├── composables/     # 组合式函数
├── layouts/        # 布局组件
├── pages/          # 页面组件
├── router/         # 路由配置
├── stores/         # 状态管理
├── utils/          # 工具函数
├── types/          # TypeScript 类型
└── App.vue
```

## 性能监控

```typescript
// 使用 Performance API
onMounted(() => {
  const perf = performance.now()
  
  // 组件初始化逻辑
  
  const duration = performance.now() - perf
  console.log(`Component mounted in ${duration.toFixed(2)}ms`)
})
```

## 调试技巧

### Vue DevTools

- 安装 [Vue DevTools](https://devtools.vuejs.org/)
- 查看组件树和状态
- 追踪事件和性能

### 控制台调试

```vue
<script setup lang="ts">
const debug = ref(true)

const log = (...args: any[]) => {
  if (debug.value) console.log('[DEBUG]', ...args)
}
</script>
```

## 参考资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Vue Use](https://vueuse.org/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)

---

**提示**：持续学习和实践是掌握 Vue 3 的关键！
