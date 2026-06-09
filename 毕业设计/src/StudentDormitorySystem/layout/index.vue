<template>
  <a-config-provider :theme="{ algorithm: themeStore.algorithm }">
    <a-layout class="layout-container">
      <!-- 侧边栏 -->
      <a-layout-sider
        v-model:collapsed="collapsed"
        :trigger="null"
        collapsible
        class="layout-sider"
      >
        <div class="logo">
          <span v-if="!collapsed">宿舍管理系统</span>
          <span v-else>宿管</span>
        </div>

        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="inline"
          :theme="themeStore.isDark ? 'dark' : 'light'"
          @click="handleMenuClick"
        >
          <a-menu-item
            v-for="item in menuItems"
            :key="item.key"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>

      <!-- 主体 -->
      <a-layout>
        <!-- 顶栏 -->
        <a-layout-header class="layout-header">
          <div class="header-left">
            <menu-unfold-outlined
              v-if="collapsed"
              class="trigger"
              @click="collapsed = !collapsed"
            />
            <menu-fold-outlined
              v-else
              class="trigger"
              @click="collapsed = !collapsed"
            />
          </div>

          <div class="header-right">
            <!-- 用户信息 -->
            <a-dropdown>
              <div class="user-info">
                <a-avatar style="background-color: #87d068">
                  <template #icon>
                    <UserOutlined />
                  </template>
                </a-avatar>
                <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.name || '管理员' }}</span>
              </div>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="profile">
                    <UserOutlined />
                    个人中心
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout" @click="handleLogout">
                    <LogoutOutlined />
                    退出登录
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </a-layout-header>

        <!-- 内容区 -->
        <a-layout-content class="layout-content">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'  // 修改为相对路径
import { useThemeStore } from '../stores/theme'  // 修改为相对路径
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  BankOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  NotificationOutlined,
  TeamOutlined
} from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const collapsed = ref(false)
const selectedKeys = ref([route.name])

const menuItems = [
  { key: 'Dashboard', label: '首页', icon: HomeOutlined },
  { key: 'Student', label: '学生管理', icon: UserOutlined },
  { key: 'Building', label: '宿舍楼管理', icon: BankOutlined },
  { key: 'Room', label: '房间管理', icon: HomeOutlined },
  { key: 'Repair', label: '报修管理', icon: ToolOutlined },
  { key: 'Attendance', label: '考勤管理', icon: CheckCircleOutlined },
  { key: 'Notice', label: '公告管理', icon: NotificationOutlined },
  { key: 'User', label: '用户管理', icon: TeamOutlined },
  { key: 'Home', label: '返回介绍', icon: HomeOutlined }
]

watch(() => route.name, (newVal) => {
  selectedKeys.value = [newVal]
})

const handleMenuClick = ({ key }) => {
  router.push({ name: key })
}

const handleLogout = () => {
  userStore.logout()
}
</script>

<style scoped lang="scss">
.layout-container {
  width: 100%;
  height: 100%;
  background: #f0f2f5;  /* 添加整体背景色 */
}

.layout-sider {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  background: #fff;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;

  .logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: #1890ff;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    transition: all 0.3s;
  }

  :deep(.ant-menu-light) {
    background: #fff;
  }

  :deep(.ant-menu-item) {
    background: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.06);
    }
  }

  :deep(.ant-menu-item-selected) {
    background: #e6f7ff;
  }
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: fixed;
  top: 0;
  right: 0;
  left: 200px;
  z-index: 99;
  
  .header-left {
    .trigger {
      font-size: 20px;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: #1890ff;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 4px;
      transition: background 0.3s;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .username {
        font-size: 14px;
      }
    }
  }
}

.layout-content {
  margin-left: 200px;
  margin-top: 64px;
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
}

// 当侧边栏收起时
.layout-sider.collapsed + .layout .layout-header {
  left: 80px;
}

.layout-sider.collapsed + .layout .layout-content {
  margin-left: 80px;
}

// 暗黑模式适配（如果需要可以保留）
:global(.dark) {
  .layout-sider {
    background: #001529;

    .logo {
      background: #001529;
      color: #fff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .layout-header {
    background: #141414;
  }

  .layout-content {
    background: #000;
  }
}
</style>