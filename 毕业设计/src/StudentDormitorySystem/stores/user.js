import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '../../router'
import { message } from 'ant-design-vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  // 登录 - 使用 Mock 数据
  const login = async (username, password) => {
    try {
      // 模拟登录验证
      if (username === 'admin' && password === '123456') {
        const mockToken = 'mock-token-' + Date.now()
        const mockUser = {
          id: 1,
          username: 'admin',
          realName: '管理员',
          name: '管理员',
          role: 'admin'
        }
        
        token.value = mockToken
        userInfo.value = mockUser
        
        localStorage.setItem('token', mockToken)
        localStorage.setItem('user', JSON.stringify(mockUser))
        
        message.success('登录成功')
        router.push('/dashboard/home')
      } else {
        message.error('用户名或密码错误')
      }
    } catch (error) {
      console.error('登录失败：', error)
      message.error('登录失败')
    }
  }

  // 退出登录
  const logout = async () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
    message.success('退出成功')
  }

  // 获取用户信息
  const getUserInfo = async () => {
    return userInfo.value
  }

  return {
    token,
    userInfo,
    login,
    logout,
    getUserInfo
  }
})