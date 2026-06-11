<template>
  <div :data-theme="theme">
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup>
import { ref, provide, watch, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'
import { setAuthState } from '@/router/index.js'

const theme = ref(localStorage.getItem('theme') || 'light')
const authStore = useAuthStore()

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}

watch(theme, (t) => {
  document.documentElement.setAttribute('data-theme', t)
}, { immediate: true })

// Informer le routeur de l'état d'auth
watch(() => authStore.loading, (loading) => {
  // Seulement quand le loading passe de true à false
  if (!loading && authStore.user) {
    setAuthState(authStore.user, false)
  } else if (!loading && !authStore.user) {
    setAuthState(null, false)
  }
}, { immediate: true })

provide('theme', theme)
provide('toggleTheme', toggleTheme)
</script>

<style>
[data-theme] { min-height: 100dvh; }
</style>
