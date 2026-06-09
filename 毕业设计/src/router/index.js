import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/home.vue'
import ManagementSystem from '../views/management-system.vue'
import StudentDormitorySystem from '../StudentDormitorySystem/views/Login.vue'
import StudentDormitorySystemLayout from '../StudentDormitorySystem/layout/index.vue'
import StudentDormitorySystemDashboard from '../StudentDormitorySystem/views/Dashboard.vue'
import StudentDormitorySystemStudent from '../StudentDormitorySystem/views/Student/index.vue'
import StudentDormitorySystemBuilding from '../StudentDormitorySystem/views/Building/index.vue'
import StudentDormitorySystemRoom from '../StudentDormitorySystem/views/Room/index.vue'
import StudentDormitorySystemRepair from '../StudentDormitorySystem/views/Repair/index.vue'
import StudentDormitorySystemAttendance from '../StudentDormitorySystem/views/Attendance/index.vue'
import StudentDormitorySystemNotice from '../StudentDormitorySystem/views/Notice/index.vue'
import StudentDormitorySystemUser from '../StudentDormitorySystem/views/User/index.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/management-system',
    name: 'ManagementSystem',
    component: ManagementSystem
  },
  {
    path: '/StudentDormitorySystem',
    name: 'StudentDormitorySystem',
    component: StudentDormitorySystem
  },
  {
    path: '/login',
    name: 'Login',
    component: StudentDormitorySystem
  },
  {
    path: '/dashboard',
    name: 'Layout',
    component: StudentDormitorySystemLayout,
    redirect: '/dashboard/home',
    children: [
      {
        path: 'home',
        name: 'Dashboard',
        component: StudentDormitorySystemDashboard,
        meta: { title: '首页' }
      },
      {
        path: 'student',
        name: 'Student',
        component: StudentDormitorySystemStudent,
        meta: { title: '学生管理' }
      },
      {
        path: 'building',
        name: 'Building',
        component: StudentDormitorySystemBuilding,
        meta: { title: '宿舍楼管理' }
      },
      {
        path: 'room',
        name: 'Room',
        component: StudentDormitorySystemRoom,
        meta: { title: '房间管理' }
      },
      {
        path: 'repair',
        name: 'Repair',
        component: StudentDormitorySystemRepair,
        meta: { title: '报修管理' }
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: StudentDormitorySystemAttendance,
        meta: { title: '考勤管理' }
      },
      {
        path: 'notice',
        name: 'Notice',
        component: StudentDormitorySystemNotice,
        meta: { title: '公告管理' }
      },
      {
        path: 'user',
        name: 'User',
        component: StudentDormitorySystemUser,
        meta: { title: '用户管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

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