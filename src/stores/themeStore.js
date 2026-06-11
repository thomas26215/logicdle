import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('logicdle_theme') === 'dark')

  function apply() {
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('logicdle_theme', isDark.value ? 'dark' : 'light')
  }

  function toggle() {
    isDark.value = !isDark.value
  }

  // Applique immédiatement au boot
  apply()
  watch(isDark, apply)

  return { isDark, toggle }
})
