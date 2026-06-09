<template>
  <div class="repair-page">
    <a-card>
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 150px">
            <a-select-option value="待处理">待处理</a-select-option>
            <a-select-option value="处理中">处理中</a-select-option>
            <a-select-option value="已完成">已完成</a-select-option>
          </a-select>
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
          新增报修
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
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button v-if="record.status === '待处理'" type="link" size="small" @click="handleAssign(record)">
                分配
              </a-button>
              <a-button v-if="record.status === '处理中'" type="link" size="small" @click="handleComplete(record)">
                完成
              </a-button>
              <a-button type="link" size="small" @click="handleView(record)">
                查看
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

    <!-- 新增报修弹窗 -->
    <a-modal v-model:open="addModalVisible" title="新增报修" width="600px" @ok="handleSubmit" @cancel="addModalVisible = false">
      <a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="报修标题" required>
          <a-input v-model:value="formState.title" placeholder="请输入报修标题" />
        </a-form-item>
        <a-form-item label="问题描述" required>
          <a-textarea v-model:value="formState.description" placeholder="请输入问题描述" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 分配维修人员弹窗 -->
    <a-modal v-model:open="assignModalVisible" title="分配维修人员" @ok="handleAssignSubmit" @cancel="assignModalVisible = false">
      <a-form :model="assignForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="维修人员" required>
          <a-input v-model:value="assignForm.repairman" placeholder="请输入维修人员姓名" />
        </a-form-item>
        <a-form-item label="联系电话" required>
          <a-input v-model:value="assignForm.repairmanPhone" placeholder="请输入联系电话" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 完成报修弹窗 -->
    <a-modal v-model:open="completeModalVisible" title="完成报修" @ok="handleCompleteSubmit" @cancel="completeModalVisible = false">
      <a-form :model="completeForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="备注">
          <a-textarea v-model:value="completeForm.remark" placeholder="请输入备注" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情弹窗 -->
    <a-modal v-model:open="viewModalVisible" title="报修详情" :footer="null" width="600px">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="报修标题">{{ currentRecord.title }}</a-descriptions-item>
        <a-descriptions-item label="问题描述">{{ currentRecord.description }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(currentRecord.status)">{{ currentRecord.status }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="维修人员">{{ currentRecord.repairman || '-' }}</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ currentRecord.repairmanPhone || '-' }}</a-descriptions-item>
        <a-descriptions-item label="提交时间">{{ currentRecord.createTime }}</a-descriptions-item>
        <a-descriptions-item label="完成时间">{{ currentRecord.completeTime || '-' }}</a-descriptions-item>
        <a-descriptions-item label="备注">{{ currentRecord.remark || '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import request from '../../utils/request'

const searchForm = reactive({
  status: undefined
})

const columns = [
  { title: '报修标题', dataIndex: 'title', key: 'title' },
  { title: '问题描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '维修人员', dataIndex: 'repairman', key: 'repairman' },
  { title: '提交时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '操作', key: 'action', width: 250 }
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

const addModalVisible = ref(false)
const assignModalVisible = ref(false)
const completeModalVisible = ref(false)
const viewModalVisible = ref(false)
const currentRecord = ref({})

const formState = reactive({
  title: '',
  description: '',
  studentId: 1,
  roomId: 1
})

const assignForm = reactive({
  id: null,
  repairman: '',
  repairmanPhone: ''
})

const completeForm = reactive({
  id: null,
  remark: ''
})

const getStatusColor = (status) => {
  const colorMap = {
    '待处理': 'orange',
    '处理中': 'blue',
    '已完成': 'green'
  }
  return colorMap[status] || 'default'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/repair/page', {
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
  pagination.current = 1
  loadData()
}

const handleReset = () => {
  searchForm.status = undefined
  handleSearch()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const handleAdd = () => {
  Object.assign(formState, { title: '', description: '', studentId: 1, roomId: 1 })
  addModalVisible.value = true
}

const handleSubmit = async () => {
  try {
    await request.post('/repair', formState)
    message.success('提交成功')
    addModalVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败：', error)
  }
}

const handleAssign = (record) => {
  Object.assign(assignForm, { id: record.id, repairman: '', repairmanPhone: '' })
  assignModalVisible.value = true
}

const handleAssignSubmit = async () => {
  try {
    await request.post(`/repair/assign/${assignForm.id}`, {
      repairman: assignForm.repairman,
      repairmanPhone: assignForm.repairmanPhone
    })
    message.success('分配成功')
    assignModalVisible.value = false
    loadData()
  } catch (error) {
    console.error('分配失败：', error)
  }
}

const handleComplete = (record) => {
  Object.assign(completeForm, { id: record.id, remark: '' })
  completeModalVisible.value = true
}

const handleCompleteSubmit = async () => {
  try {
    await request.post(`/repair/complete/${completeForm.id}`, { remark: completeForm.remark })
    message.success('操作成功')
    completeModalVisible.value = false
    loadData()
  } catch (error) {
    console.error('操作失败：', error)
  }
}

const handleView = (record) => {
  currentRecord.value = record
  viewModalVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/repair/${id}`)
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

.repair-page {
  .search-form {
    margin-bottom: 16px;
  }

  .action-bar {
    margin-bottom: 16px;
  }
}
</style>

