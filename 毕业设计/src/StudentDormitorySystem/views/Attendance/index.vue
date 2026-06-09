<template>
  <div class="attendance-page">
    <a-card>
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="类型">
          <a-select v-model:value="searchForm.type" placeholder="请选择类型" allow-clear style="width: 150px">
            <a-select-option value="晚归">晚归</a-select-option>
            <a-select-option value="缺寝">缺寝</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="日期范围">
          <a-range-picker v-model:value="dateRange" format="YYYY-MM-DD" />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <!-- 操作按钮 -->
      <div class="action-bar">
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新增记录
        </a-button>
      </div>

      <!-- 表格 -->
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="record.type === '晚归' ? 'orange' : 'red'">
              {{ record.type }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record)">
                编辑
              </a-button>
              <a-popconfirm title="确定删除吗？" @confirm="handleDelete(record.id)">
                <a-button type="link" size="small" danger>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="600px"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
    >
      <a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="日期" required>
          <a-date-picker v-model:value="formState.date" format="YYYY-MM-DD" style="width: 100%" />
        </a-form-item>
        <a-form-item label="类型" required>
          <a-select v-model:value="formState.type" placeholder="请选择类型">
            <a-select-option value="晚归">晚归</a-select-option>
            <a-select-option value="缺寝">缺寝</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="原因">
          <a-textarea v-model:value="formState.reason" placeholder="请输入原因" :rows="3" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="formState.remark" placeholder="请输入备注" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import request from '../../utils/request'
import dayjs from 'dayjs'

const searchForm = reactive({
  type: undefined,
  startDate: undefined,
  endDate: undefined
})

const dateRange = ref([])

const columns = [
  { title: '日期', dataIndex: 'date', key: 'date' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '操作', key: 'action', width: 180 }
]

const dataSource = ref([])
const loading = ref(false)
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: total => `共 ${total} 条`
})

const modalVisible = ref(false)
const modalTitle = ref('新增记录')
const formState = reactive({
  id: null,
  studentId: 1,
  roomId: 1,
  date: null,
  type: '晚归',
  reason: '',
  remark: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/attendance/page', {
      params: {
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
        ...searchForm
      }
    })
    dataSource.value = res.data.records
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    searchForm.startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
    searchForm.endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
  } else {
    searchForm.startDate = undefined
    searchForm.endDate = undefined
  }
  pagination.current = 1
  loadData()
}

const handleReset = () => {
  searchForm.type = undefined
  dateRange.value = []
  searchForm.startDate = undefined
  searchForm.endDate = undefined
  handleSearch()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const handleAdd = () => {
  modalTitle.value = '新增记录'
  Object.assign(formState, {
    id: null,
    studentId: 1,
    roomId: 1,
    date: dayjs(),
    type: '晚归',
    reason: '',
    remark: ''
  })
  modalVisible.value = true
}

const handleEdit = (record) => {
  modalTitle.value = '编辑记录'
  Object.assign(formState, {
    ...record,
    date: dayjs(record.date)
  })
  modalVisible.value = true
}

const handleSubmit = async () => {
  try {
    const data = {
      ...formState,
      date: dayjs(formState.date).format('YYYY-MM-DD')
    }
    
    if (formState.id) {
      await request.put('/attendance', data)
      message.success('修改成功')
    } else {
      await request.post('/attendance', data)
      message.success('添加成功')
    }
    modalVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败：', error)
  }
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/attendance/${id}`)
    message.success('删除成功')
    loadData()
  } catch (error) {
    console.error('删除失败：', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.attendance-page {
  .search-form {
    margin-bottom: 16px;
  }

  .action-bar {
    margin-bottom: 16px;
  }
}
</style>

