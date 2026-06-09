<template>
  <div class="dashboard">
    <!-- 统计卡片行 -->
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card stat-card-green">
          <div class="stat-icon">
            <UserOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-title">学生总数</div>
            <div class="stat-value">{{ stats.studentCount }}</div>
          </div>
        </div>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card stat-card-blue">
          <div class="stat-icon">
            <BankOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-title">宿舍楼数量</div>
            <div class="stat-value">{{ stats.buildingCount }}</div>
          </div>
        </div>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card stat-card-red">
          <div class="stat-icon">
            <ToolOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-title">待处理报修</div>
            <div class="stat-value">{{ stats.pendingRepairCount }}</div>
          </div>
        </div>
      </a-col>

      <a-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card stat-card-orange">
          <div class="stat-icon">
            <WarningOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-title">本月考勤异常</div>
            <div class="stat-value">{{ stats.attendanceCount }}</div>
          </div>
        </div>
      </a-col>
    </a-row>

    <!-- 图表行 -->
    <a-row :gutter="[16, 16]" :style="{ marginTop: '16px' }">
      <!-- 学生性别分布 -->
      <a-col :xs="24" :lg="12">
        <a-card title="学生性别分布" :bordered="false" class="chart-card">
          <v-chart :option="genderChartOption" style="height: 300px" autoresize />
        </a-card>
      </a-col>

      <!-- 报修状态统计 -->
      <a-col :xs="24" :lg="12">
        <a-card title="报修状态统计" :bordered="false" class="chart-card">
          <v-chart :option="repairChartOption" style="height: 300px" autoresize />
        </a-card>
      </a-col>
    </a-row>

    <!-- 图表行2 -->
    <a-row :gutter="[16, 16]" :style="{ marginTop: '16px' }">
      <!-- 近7天考勤趋势 -->
      <a-col :xs="24" :lg="16">
        <a-card title="近7天考勤趋势" :bordered="false" class="chart-card">
          <v-chart :option="attendanceTrendOption" style="height: 300px" autoresize />
        </a-card>
      </a-col>

      <!-- 宿舍入住率 -->
      <a-col :xs="24" :lg="8">
        <a-card title="宿舍入住率" :bordered="false" class="chart-card">
          <v-chart :option="occupancyChartOption" style="height: 300px" autoresize />
        </a-card>
      </a-col>
    </a-row>

    <!-- 快捷入口 -->
    <a-card title="快捷入口" :bordered="false" :style="{ marginTop: '16px' }" class="quick-access-card">
      <a-row :gutter="[16, 16]">
        <a-col :xs="12" :sm="8" :md="6" v-for="item in quickAccessItems" :key="item.key">
          <div class="quick-item" @click="handleQuickAccess(item.key)">
            <div class="quick-icon" :style="{ background: item.color }">
              <component :is="item.icon" />
            </div>
            <div class="quick-label">{{ item.label }}</div>
          </div>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  UserOutlined, 
  BankOutlined, 
  ToolOutlined, 
  WarningOutlined,
  CheckCircleOutlined,
  NotificationOutlined,
  TeamOutlined,
  HomeOutlined
} from '@ant-design/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import request from '../utils/request'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()

// 统计数据
const stats = ref({
  studentCount: 0,
  buildingCount: 0,
  pendingRepairCount: 0,
  attendanceCount: 0
})

// 学生数据
const studentData = ref([])
const repairData = ref([])

// 快捷入口配置
const quickAccessItems = [
  { key: 'Student', label: '学生管理', icon: UserOutlined, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { key: 'Building', label: '宿舍楼管理', icon: BankOutlined, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { key: 'Room', label: '房间管理', icon: HomeOutlined, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { key: 'Repair', label: '报修管理', icon: ToolOutlined, color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { key: 'Attendance', label: '考勤管理', icon: CheckCircleOutlined, color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { key: 'Notice', label: '公告管理', icon: NotificationOutlined, color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { key: 'User', label: '用户管理', icon: TeamOutlined, color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
]

// 学生性别分布图表配置
const genderChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    bottom: '5%',
    left: 'center'
  },
  series: [
    {
      name: '性别分布',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 24,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { 
          value: studentData.value.filter(s => s.gender === '男').length, 
          name: '男生',
          itemStyle: { color: '#5470c6' }
        },
        { 
          value: studentData.value.filter(s => s.gender === '女').length, 
          name: '女生',
          itemStyle: { color: '#ee6666' }
        }
      ]
    }
  ]
}))

// 报修状态统计图表配置
const repairChartOption = computed(() => {
  const statusCount = {
    '待处理': 0,
    '处理中': 0,
    '已完成': 0
  }
  
  repairData.value.forEach(repair => {
    if (statusCount[repair.status] !== undefined) {
      statusCount[repair.status]++
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['待处理', '处理中', '已完成'],
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '报修数量',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#83bff6' },
              { offset: 1, color: '#188df0' }
            ]
          }
        },
        data: [statusCount['待处理'], statusCount['处理中'], statusCount['已完成']]
      }
    ]
  }
})

// 考勤趋势图表配置
const attendanceTrendOption = ref({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['晚归', '缺寝'],
    bottom: '5%'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '晚归',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#ee6666' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(238, 102, 102, 0.3)' },
            { offset: 1, color: 'rgba(238, 102, 102, 0.05)' }
          ]
        }
      },
      data: [2, 3, 1, 4, 2, 1, 0]
    },
    {
      name: '缺寝',
      type: 'line',
      smooth: true,
      itemStyle: { color: '#fac858' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(250, 200, 88, 0.3)' },
            { offset: 1, color: 'rgba(250, 200, 88, 0.05)' }
          ]
        }
      },
      data: [1, 0, 2, 1, 0, 1, 1]
    }
  ]
})

// 宿舍入住率图表配置
const occupancyChartOption = ref({
  tooltip: {
    formatter: '{a} <br/>{b}: {c}%'
  },
  series: [
    {
      name: '入住率',
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'center',
        formatter: '85%\n入住率',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 24
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { 
          value: 85, 
          name: '已入住',
          itemStyle: { 
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#91cc75' },
                { offset: 1, color: '#5ab54f' }
              ]
            }
          }
        },
        { 
          value: 15, 
          name: '空闲',
          itemStyle: { color: '#f0f0f0' }
        }
      ]
    }
  ]
})

// 加载统计数据
const loadStats = async () => {
  try {
    const [students, buildings, repairs, attendance] = await Promise.all([
      request.get('/student/list'),
      request.get('/building/list'),
      request.get('/repair/page', { params: { pageNum: 1, pageSize: 100 } }),
      request.get('/attendance/page', { params: { pageNum: 1, pageSize: 1 } })
    ])

    studentData.value = students.data || []
    repairData.value = repairs.data?.records || []

    stats.value.studentCount = studentData.value.length
    stats.value.buildingCount = buildings.data?.length || 0
    stats.value.pendingRepairCount = repairData.value.filter(r => r.status === '待处理').length
    stats.value.attendanceCount = attendance.data?.total || 0
  } catch (error) {
    console.error('加载统计数据失败：', error)
  }
}

// 快捷访问
const handleQuickAccess = (key) => {
  router.push({ name: key })
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped lang="scss">
.dashboard {
  // 统计卡片
  .stat-card {
    position: relative;
    display: flex;
    align-items: center;
    padding: 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: currentColor;
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #fff;
      border-radius: 12px;
      margin-right: 16px;
    }

    .stat-content {
      flex: 1;

      .stat-title {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #333;
      }
    }
  }

  .stat-card-green {
    &::before {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }

  .stat-card-blue {
    &::before {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }

  .stat-card-red {
    &::before {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
  }

  .stat-card-orange {
    &::before {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    .stat-icon {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }
  }

  // 图表卡片
  .chart-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    :deep(.ant-card-head) {
      border-bottom: 2px solid #f0f0f0;
      font-weight: 600;
    }

    :deep(.ant-card-body) {
      padding: 24px;
    }
  }

  // 快捷入口
  .quick-access-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    :deep(.ant-card-head) {
      border-bottom: 2px solid #f0f0f0;
      font-weight: 600;
    }

    .quick-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: #fff;
      border: 2px solid #f0f0f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        border-color: #1890ff;
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);

        .quick-icon {
          transform: scale(1.1);
        }
      }

      .quick-icon {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;
        border-radius: 12px;
        margin-bottom: 12px;
        transition: all 0.3s;
      }

      .quick-label {
        font-size: 14px;
        color: #333;
        font-weight: 500;
      }
    }
  }
}
</style>
