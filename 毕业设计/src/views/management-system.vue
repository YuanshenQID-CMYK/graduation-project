<template>
  <div class="management-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 未登录状态 -->
    <div v-if="!isLoggedIn" class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2><i class="fas fa-cogs"></i> 人员管理系统</h2>
          <p>{{ authMode === 'login' ? '登录您的账号' : '注册新账号' }}</p>
        </div>
        
        <div class="auth-tabs">
          <button :class="{ active: authMode === 'login' }" @click="authMode = 'login'">登录</button>
          <button :class="{ active: authMode === 'register' }" @click="authMode = 'register'">注册</button>
        </div>

        <!-- 登录表单 -->
        <form v-if="authMode === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <div class="role-select">
            <label class="role-option">
              <input type="radio" value="user" v-model="loginRole">
              <span>普通用户</span>
            </label>
            <label class="role-option">
              <input type="radio" value="admin" v-model="loginRole">
              <span>管理员</span>
            </label>
            <label class="role-option">
              <input type="radio" value="guest" v-model="loginRole">
              <span>游客</span>
            </label>
          </div>
          
          <div class="input-group">
            <i class="fas fa-user"></i>
            <input type="text" v-model="loginForm.loginId" placeholder="姓名 / 工号 / 邮箱" required>
          </div>
          
          <div v-if="loginRole !== 'guest'" class="input-group">
            <i class="fas fa-lock"></i>
            <input type="password" v-model="loginForm.password" placeholder="密码" required>
          </div>
          
          <button type="submit" class="submit-btn">
            <i class="fas" :class="loginRole === 'guest' ? 'fa-eye' : 'fa-sign-in-alt'"></i>
            {{ loginRole === 'guest' ? '游客进入' : '登录' }}
          </button>
        </form>

        <!-- 注册表单 -->
        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="input-group">
            <i class="fas fa-id-card"></i>
            <input type="text" v-model="registerForm.employee_id" placeholder="工号" required>
          </div>
          <div class="input-group">
            <i class="fas fa-user"></i>
            <input type="text" v-model="registerForm.username" placeholder="姓名" required>
          </div>
          <div class="input-group">
            <i class="fas fa-envelope"></i>
            <input type="email" v-model="registerForm.email" placeholder="邮箱" required>
          </div>
          <div class="input-group">
            <i class="fas fa-phone"></i>
            <input type="tel" v-model="registerForm.phone" placeholder="电话" required>
          </div>
          <div class="input-group">
            <i class="fas fa-venus-mars"></i>
            <select v-model="registerForm.gender">
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="保密">保密</option>
            </select>
          </div>
          <div class="input-group">
            <i class="fas fa-key"></i>
            <input type="password" v-model="registerForm.password" placeholder="密码" required>
          </div>
          <div class="input-group">
            <i class="fas fa-check-circle"></i>
            <input type="password" v-model="registerForm.confirmPassword" placeholder="确认密码" required>
          </div>
          <button type="submit" class="submit-btn"><i class="fas fa-user-plus"></i> 注册</button>
        </form>
        
        <p v-if="authError" class="error-message"><i class="fas fa-exclamation-triangle"></i> {{ authError }}</p>
      </div>
    </div>

    <!-- 已登录状态 - 管理系统主页 -->
    <div v-else class="system-wrapper">
      <!-- 侧边栏 -->
      <div class="sidebar">
        <div class="logo">
          <i class="fas fa-cogs"></i>
          <span>管理系统</span>
        </div>
        <ul class="menu">
          <li :class="{ active: currentPage === 'dashboard' }" @click="currentPage = 'dashboard'">
            <i class="fas fa-home"></i><span>控制台</span>
          </li>
          <li v-if="currentUser?.role === 'admin'" :class="{ active: currentPage === 'user' }" @click="currentPage = 'user'">
            <i class="fas fa-users"></i><span>用户管理</span>
          </li>
          <li :class="{ active: currentPage === 'data' }" @click="currentPage = 'data'">
            <i class="fas fa-table"></i><span>数据列表</span>
          </li>
          <li :class="{ active: currentPage === 'chart' }" @click="currentPage = 'chart'">
            <i class="fas fa-chart-bar"></i><span>统计分析</span>
          </li>
          <li @click="goToHome">
            <i class="fas fa-cog"></i><span>返回</span>
          </li>
        </ul>
      </div>

      <!-- 主内容区 -->
      <div class="main">
        <div class="header">
          <div class="header-left">
            <h2>{{ pageTitle }}</h2>
          </div>
          <div class="header-right">
            <button class="theme-btn" @click="toggleTheme">
              <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
            </button>
            <div class="user" @click="showUserMenu = !showUserMenu">
              <span>{{ currentUser?.username || '用户' }}</span>
              <i class="fas fa-chevron-down"></i>
            </div>
            <div class="user-menu" v-if="showUserMenu">
              <a @click="handleLogout"><i class="fas fa-sign-out-alt"></i> 退出登录</a>
            </div>
          </div>
        </div>

        <div class="container">
          <!-- 控制台页面 -->
          <div v-show="currentPage === 'dashboard'" class="page">
            <div class="page-title">数据概览</div>
            <div class="stats">
              <div class="card"><h3>总用户</h3><div class="num">{{ userList.length }}</div></div>
              <div class="card"><h3>管理员</h3><div class="num">{{ adminCount }}</div></div>
              <div class="card"><h3>普通用户</h3><div class="num">{{ userList.length - adminCount }}</div></div>
              <div class="card"><h3>活跃率</h3><div class="num">{{ activeRate }}%</div></div>
            </div>
            <div class="chart-row">
              <div class="chart-box"><canvas id="userChart"></canvas></div>
              <div class="chart-box"><canvas id="roleChart"></canvas></div>
            </div>
            <div class="table-box">
              <div class="table-title">最新用户</div>
              <table class="user-table">
                <thead>
                  <tr><th>工号</th><th>用户名</th><th>邮箱</th><th>角色</th><th>状态</th></tr>
                </thead>
                <tbody>
                  <tr v-for="user in userList.slice(0, 5)" :key="user.id">
                    <td>{{ user?.employee_id || '-' }}</td>
                    <td>{{ user?.username || '-' }}</td>
                    <td>{{ user?.email || '-' }}</td>
                    <td><span class="role-badge" :class="user?.role">{{ user?.role === 'admin' ? '管理员' : '普通用户' }}</span></td>
                    <td><span class="status-badge" :class="user?.status">{{ user?.status === 'active' ? '正常' : '禁用' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 用户管理页面（仅管理员可见） -->
          <div v-show="currentPage === 'user' && currentUser?.role === 'admin'" class="page">
            <div class="page-title">用户管理</div>
            
            <div class="card" style="margin-bottom:20px;">
              <div class="table-tool">
                <h3><i class="fas fa-user-plus"></i> 新增用户</h3>
              </div>
              <div class="form-row">
                <div class="form-group"><label>工号</label><input type="text" v-model="newUser.employee_id" class="form-control" placeholder="工号"></div>
                <div class="form-group"><label>姓名</label><input type="text" v-model="newUser.username" class="form-control" placeholder="姓名"></div>
                <div class="form-group"><label>邮箱</label><input type="email" v-model="newUser.email" class="form-control" placeholder="邮箱"></div>
                <div class="form-group"><label>手机号</label><input type="tel" v-model="newUser.phone" class="form-control" placeholder="手机号"></div>
                <div class="form-group"><label>密码</label><input type="password" v-model="newUser.password" class="form-control" placeholder="密码"></div>
                <div class="form-group"><label>角色</label>
                  <select v-model="newUser.role" class="form-control">
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-success" @click="addUser"><i class="fas fa-save"></i> 提交保存</button>
            </div>

            <div class="table-box">
              <div class="table-tool">
                <h3><i class="fas fa-list"></i> 用户列表</h3>
                <div>
                  <input type="text" class="search" v-model="searchKeyword" placeholder="搜索用户...">
                  <i class="fas fa-search search-icon"></i>
                </div>
              </div>
              <table class="user-table admin-table">
  <thead>
    <tr>
      <th>工号</th><th>姓名</th><th>邮箱</th><th>手机号</th><th>角色</th><th>状态</th><th>操作</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="user in filteredUserList" :key="user.id">
      <td>{{ user?.employee_id || '-' }}</td>
      <td>{{ user?.username || '-' }}</td>
      <td>{{ user?.email || '-' }}</td>
      <td>{{ user?.phone || '-' }}</td>
      <td>
        <select :value="user?.role" @change="updateRole(user.id, $event.target.value)" :disabled="user.id === currentUser?.id" class="role-select">
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
        </select>
      </td>
      <td>
        <button class="status-btn" :class="user?.status" @click="toggleStatus(user.id, user?.status)">
          {{ user?.status === 'active' ? '启用' : '禁用' }}
        </button>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" @click="deleteUser(user.id)" :disabled="user.id === currentUser?.id">
          <i class="fas fa-trash"></i> 删除
        </button>
      </td>
    </tr>
  </tbody>
</table>
            </div>
          </div>

          <!-- 数据列表页面 -->
          <div v-show="currentPage === 'data'" class="page">
            <div class="page-title">数据列表</div>
            <div class="table-box">
              <div class="table-tool">
                <h3><i class="fas fa-database"></i> 业务数据</h3>
                <div>
                  <input type="text" class="search" v-model="dataSearch" placeholder="搜索...">
                  <button class="btn btn-primary" @click="exportData"><i class="fas fa-download"></i> 导出</button>
                </div>
              </div>
              <table class="data-table">
                <thead>
                  <tr><th>ID</th><th>数据名称</th><th>分类</th><th>金额</th><th>时间</th><th>状态</th></tr>
                </thead>
                <tbody>
                  <tr v-for="item in filteredDataList" :key="item.id">
                    <td>{{ item.id }}</td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.category }}</td>
                    <td>¥{{ formatMoney(item.amount) }}</td>
                    <td>{{ item.date }}</td>
                    <td><span class="status-badge success">{{ item.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 统计分析页面 -->
          <div v-show="currentPage === 'chart'" class="page">
            <div class="page-title">统计分析</div>
            <div class="stats">
              <div class="card"><h3>月收入</h3><div class="num">¥86,245</div></div>
              <div class="card"><h3>月订单</h3><div class="num">426</div></div>
              <div class="card"><h3>新增用户</h3><div class="num">{{ newUsersThisMonth }}</div></div>
              <div class="card"><h3>转化率</h3><div class="num">32.8%</div></div>
            </div>
            <div class="chart-row">
              <div class="chart-box"><canvas id="incomeChart"></canvas></div>
              <div class="chart-box"><canvas id="orderChart"></canvas></div>
            </div>
            <div class="chart-row">
              <div class="chart-box"><canvas id="trendChart"></canvas></div>
              <div class="chart-box"><canvas id="categoryChart"></canvas></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = 'http://localhost:3000/api'

// 跳转到首页
const goToHome = () => {
  router.push('/')
}

// 主题
const isDarkMode = ref(false)
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value)
}

// 页面状态
const isLoggedIn = ref(false)
const currentUser = ref(null)
const authMode = ref('login')
const authError = ref('')
const loginRole = ref('user')
const currentPage = ref('dashboard')
const showUserMenu = ref(false)
const searchKeyword = ref('')
const dataSearch = ref('')
const userAvatar = ref('https://via.placeholder.com/40')

// 数据
const userList = ref([])
const logs = ref([])

// 新增用户表单
const newUser = ref({
  employee_id: '', username: '', email: '', phone: '', password: '', role: 'user'
})

// 登录表单
const loginForm = ref({ loginId: '', password: '' })
const registerForm = ref({ 
  employee_id: '', username: '', email: '', phone: '', 
  gender: '保密', password: '', confirmPassword: '' 
})

let authToken = null
let userChart = null, roleChart = null, incomeChart = null
let orderChart = null, trendChart = null, categoryChart = null

// 业务数据
const businessData = ref([
  { id: 'D001', name: '订单收入', category: '销售', amount: 2580, date: '2025-01-10', status: '已完成' },
  { id: 'D002', name: '会员充值', category: '收费', amount: 398, date: '2025-01-11', status: '已完成' },
  { id: 'D003', name: '广告收入', category: '营销', amount: 12600, date: '2025-01-12', status: '已完成' },
  { id: 'D004', name: '退款', category: '售后', amount: -860, date: '2025-01-13', status: '已处理' },
  { id: 'D005', name: '咨询费', category: '服务', amount: 1500, date: '2025-01-14', status: '已完成' },
  { id: 'D006', name: '培训费', category: '教育', amount: 3200, date: '2025-01-15', status: '进行中' }
])

// 计算属性
const pageTitle = computed(() => {
  const titles = { dashboard: '控制台', user: '用户管理', data: '数据列表', chart: '统计分析' }
  return titles[currentPage.value] || '管理系统'
})

const adminCount = computed(() => userList.value.filter(u => u?.role === 'admin').length)
const activeRate = computed(() => {
  const active = userList.value.filter(u => u?.status === 'active').length
  return userList.value.length ? ((active / userList.value.length) * 100).toFixed(1) : 0
})
const newUsersThisMonth = computed(() => Math.floor(Math.random() * 100) + 50)

const filteredUserList = computed(() => {
  if (!searchKeyword.value) return userList.value
  const kw = searchKeyword.value.toLowerCase()
  return userList.value.filter(u => 
    u?.employee_id?.toLowerCase().includes(kw) ||
    u?.username?.toLowerCase().includes(kw) ||
    u?.email?.toLowerCase().includes(kw)
  )
})

const filteredDataList = computed(() => {
  if (!dataSearch.value) return businessData.value
  const kw = dataSearch.value.toLowerCase()
  return businessData.value.filter(d => 
    d.name.toLowerCase().includes(kw) || 
    d.category.toLowerCase().includes(kw)
  )
})

// 安全获取 JSON
async function safeJson(res) {
  const text = await res.text()
  if (!text) return {}
  try { return JSON.parse(text) } catch (e) { return {} }
}

// 初始化图表
function initCharts() {
  nextTick(() => {
    const userCtx = document.getElementById('userChart')?.getContext('2d')
    if (userCtx) {
      if (userChart) userChart.destroy()
      userChart = new Chart(userCtx, {
        type: 'line',
        data: { labels: ['1月', '2月', '3月', '4月', '5月', '6月'], datasets: [{ label: '用户增长', data: [120, 135, 148, 170, 195, 210], borderColor: '#667eea', backgroundColor: 'rgba(102,126,234,0.1)', fill: true }] }
      })
    }

    const roleCtx = document.getElementById('roleChart')?.getContext('2d')
    if (roleCtx) {
      if (roleChart) roleChart.destroy()
      roleChart = new Chart(roleCtx, {
        type: 'doughnut',
        data: { labels: ['管理员', '普通用户'], datasets: [{ data: [adminCount.value, userList.value.length - adminCount.value], backgroundColor: ['#e74c3c', '#3498db'] }] }
      })
    }

    const incomeCtx = document.getElementById('incomeChart')?.getContext('2d')
    if (incomeCtx) {
      if (incomeChart) incomeChart.destroy()
      incomeChart = new Chart(incomeCtx, {
        type: 'bar',
        data: { labels: ['1月', '2月', '3月', '4月', '5月', '6月'], datasets: [{ label: '月收入(千元)', data: [65, 72, 80, 78, 95, 86], backgroundColor: '#667eea' }] }
      })
    }

    const orderCtx = document.getElementById('orderChart')?.getContext('2d')
    if (orderCtx) {
      if (orderChart) orderChart.destroy()
      orderChart = new Chart(orderCtx, {
        type: 'line',
        data: { labels: ['1月', '2月', '3月', '4月', '5月', '6月'], datasets: [{ label: '订单量', data: [320, 350, 380, 410, 440, 426], borderColor: '#2ecc71', fill: false }] }
      })
    }

    const trendCtx = document.getElementById('trendChart')?.getContext('2d')
    if (trendCtx) {
      if (trendChart) trendChart.destroy()
      trendChart = new Chart(trendCtx, {
        type: 'line',
        data: { labels: ['1周', '2周', '3周', '4周'], datasets: [{ label: '活跃用户趋势', data: [180, 210, 245, 280], borderColor: '#f39c12', fill: true }] }
      })
    }

    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d')
    if (categoryCtx) {
      if (categoryChart) categoryChart.destroy()
      categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: { labels: ['销售', '收费', '营销', '售后', '服务', '教育'], datasets: [{ data: [45, 20, 15, 10, 5, 5], backgroundColor: ['#667eea', '#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6'] }] }
      })
    }
  })
}

// 监听数据变化
watch([userList, adminCount, currentPage], () => {
  if ((currentPage.value === 'dashboard' || currentPage.value === 'chart') && window.Chart) {
    initCharts()
  }
})

// 登录
const handleLogin = async () => {
  authError.value = ''
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: loginForm.value.loginId,
        password: loginForm.value.password,
        roleType: loginRole.value
      })
    })
    const data = await safeJson(res)
    if (res.ok) {
      authToken = data.token
      currentUser.value = data.user
      isLoggedIn.value = true
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('current_user', JSON.stringify(data.user))
      if (currentUser.value?.role !== 'guest') {
        await fetchUserList()
        if (currentUser.value?.role === 'admin') await fetchLogs()
      }
      loginForm.value = { loginId: '', password: '' }
    } else {
      authError.value = data.message || '登录失败'
    }
  } catch (error) {
    authError.value = '网络错误，请确保后端服务已启动'
  }
}

// 注册
const handleRegister = async () => {
  authError.value = ''
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    authError.value = '两次输入的密码不一致'
    return
  }
  if (registerForm.value.password.length < 6) {
    authError.value = '密码长度至少6位'
    return
  }
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: registerForm.value.employee_id,
        username: registerForm.value.username,
        email: registerForm.value.email,
        phone: registerForm.value.phone,
        gender: registerForm.value.gender,
        password: registerForm.value.password
      })
    })
    const data = await safeJson(res)
    if (res.ok) {
      authMode.value = 'login'
      registerForm.value = { employee_id: '', username: '', email: '', phone: '', gender: '保密', password: '', confirmPassword: '' }
      alert('注册成功，请登录')
    } else {
      authError.value = data.message || '注册失败'
    }
  } catch (error) {
    authError.value = '网络错误'
  }
}

// 退出登录
const handleLogout = () => {
  isLoggedIn.value = false
  currentUser.value = null
  authToken = null
  showUserMenu.value = false
  localStorage.removeItem('auth_token')
  localStorage.removeItem('current_user')
}

// 获取用户列表
const fetchUserList = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const data = await safeJson(res)
    if (res.ok) userList.value = data || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

// 获取日志
const fetchLogs = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/logs`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
    const data = await safeJson(res)
    if (res.ok) logs.value = data || []
  } catch (error) {
    console.error('获取日志失败:', error)
  }
}

// 修改角色
const updateRole = async (userId, newRole) => {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ role: newRole })
    })
    const data = await safeJson(res)
    alert(data.message || (res.ok ? '修改成功' : '修改失败'))
    if (res.ok) fetchUserList()
  } catch (error) { alert('操作失败') }
}

// 删除用户
const deleteUser = async (userId) => {
  if (confirm('确定要删除该用户吗？')) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      const data = await safeJson(res)
      alert(data.message || (res.ok ? '删除成功' : '删除失败'))
      if (res.ok) fetchUserList()
    } catch (error) { alert('删除失败') }
  }
}

// 切换状态
const toggleStatus = async (userId, currentStatus) => {
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  if (confirm(`确定要${action}该用户吗？`)) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await safeJson(res)
      alert(data.message || (res.ok ? '操作成功' : '操作失败'))
      if (res.ok) fetchUserList()
    } catch (error) { alert('操作失败') }
  }
}

// 添加用户
const addUser = async () => {
  if (!newUser.value.employee_id || !newUser.value.username || !newUser.value.email || !newUser.value.phone || !newUser.value.password) {
    alert('请填写所有必填字段')
    return
  }
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({
        employee_id: newUser.value.employee_id,
        username: newUser.value.username,
        email: newUser.value.email,
        phone: newUser.value.phone,
        password: newUser.value.password,
        gender: '保密'
      })
    })
    const data = await safeJson(res)
    if (res.ok) {
      alert('用户添加成功')
      newUser.value = { employee_id: '', username: '', email: '', phone: '', password: '', role: 'user' }
      fetchUserList()
    } else {
      alert(data.message || '添加失败')
    }
  } catch (error) { alert('添加失败') }
}

// 导出数据
const exportData = () => {
  const csv = businessData.value.map(d => `${d.id},${d.name},${d.category},${d.amount},${d.date},${d.status}`).join('\n')
  const blob = new Blob([`ID,名称,分类,金额,时间,状态\n${csv}`], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '业务数据.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const formatMoney = (amount) => amount.toLocaleString()

// 点击外部关闭用户菜单
const handleClickOutside = (e) => {
  if (!e.target.closest('.user')) showUserMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  const token = localStorage.getItem('auth_token')
  const savedUser = localStorage.getItem('current_user')
  const savedTheme = localStorage.getItem('darkMode')
  if (savedTheme === 'true') isDarkMode.value = true
  
  if (token && savedUser) {
    authToken = token
    try {
      currentUser.value = JSON.parse(savedUser)
      isLoggedIn.value = true
      if (currentUser.value?.role !== 'guest') {
        fetchUserList()
        if (currentUser.value?.role === 'admin') fetchLogs()
      }
    } catch (e) { console.error('解析用户数据失败:', e) }
  }
  
  // 引入 Chart.js
  if (!window.Chart) {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js'
    script.onload = () => initCharts()
    document.head.appendChild(script)
  } else {
    initCharts()
  }
})
</script>

<style src="/public/css/management-system.css"></style>