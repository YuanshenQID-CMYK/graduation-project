import { defineStore } from 'pinia'
import { ref } from 'vue'
import { theme } from 'ant-design-vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')
  
  const algorithm = ref(
    isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm
  )

  const toggleTheme = () => {
    isDark.value = !isDark.value
    algorithm.value = isDark.value ? theme.darkAlgorithm : theme.defaultAlgorithm
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    
    // 更新body类名
    if (isDark.value) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }

  // 初始化时设置body类名
  if (isDark.value) {
    document.body.classList.add('dark')
  }

  return {
    isDark,
    algorithm,
    toggleTheme
  }
})

