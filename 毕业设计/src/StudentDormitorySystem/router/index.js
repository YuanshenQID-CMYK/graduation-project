import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/dashboard',
    name: 'Layout',
    component: () => import('../layout/index.vue'),
    redirect: '/dashboard/home',
    children: [
      {
        path: 'home',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'student',
        name: 'Student',
        component: () => import('../views/Student/index.vue'),
        meta: { title: '学生管理' }
      },
      {
        path: 'building',
        name: 'Building',
        component: () => import('../views/Building/index.vue'),
        meta: { title: '宿舍楼管理' }
      },
      {
        path: 'room',
        name: 'Room',
        component: () => import('../views/Room/index.vue'),
        meta: { title: '房间管理' }
      },
      {
        path: 'repair',
        name: 'Repair',
        component: () => import('../views/Repair/index.vue'),
        meta: { title: '报修管理' }
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('../views/Attendance/index.vue'),
        meta: { title: '考勤管理' }
      },
      {
        path: 'notice',
        name: 'Notice',
        component: () => import('../views/Notice/index.vue'),
        meta: { title: '公告管理' }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('../views/User/index.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('../../components/home.vue'),
        meta: { title: '返回介绍' }
      }
    ]
  },
  // {
  //   path: '/',
  //   redirect: '/login'  // 根路径重定向到登录页，而不是导入不存在的文件
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard/home')
  } else {
    next()
  }
})

export default router