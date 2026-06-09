import axios from 'axios'
import { message } from 'ant-design-vue'
import router1 from '../router'

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 15000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    
    if (res.code && res.code !== 200) {
      message.error(res.message || '请求失败')
      
      if (res.code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },
  error => {
    console.error('响应错误：', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        message.error('未登录或登录已过期，请重新登录')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      } else if (status === 403) {
        message.error('没有权限访问')
      } else if (status === 404) {
        message.error('请求的资源不存在')
      } else if (status === 500) {
        message.error(data?.message || '服务器错误')
      } else {
        message.error(data?.message || '请求失败')
      }
    } else if (error.message.includes('timeout')) {
      message.error('请求超时，请稍后重试')
    } else if (error.message.includes('Network Error')) {
      message.error('网络连接失败，请检查网络')
    } else {
      message.error('请求失败')
    }
    
    return Promise.reject(error)
  }
)

// 确保有默认导出
export default request