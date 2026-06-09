<template>
  <div class="student-page">
    <a-card>
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="学号">
          <a-input v-model:value="searchForm.studentNo" placeholder="请输入学号" allow-clear />
        </a-form-item>
        <a-form-item label="姓名">
          <a-input v-model:value="searchForm.name" placeholder="请输入姓名" allow-clear />
        </a-form-item>
        <a-form-item label="班级">
          <a-input v-model:value="searchForm.className" placeholder="请输入班级" allow-clear />
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
          新增学生
        </a-button>
        <a-button danger :disabled="!selectedRowKeys.length" @click="handleBatchDelete">
          <template #icon><DeleteOutlined /></template>
          批量删除
        </a-button>
      </div>

      <!-- 表格 -->
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'gender'">
            <a-tag :color="record.gender === '男' ? 'blue' : 'pink'">
              {{ record.gender }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === '在校' ? 'success' : 'default'">
              {{ record.status }}
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
      @cancel="handleCancel"
    >
      <a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="学号" required>
          <a-input v-model:value="formState.studentNo" placeholder="请输入学号" />
        </a-form-item>
        <a-form-item label="姓名" required>
          <a-input v-model:value="formState.name" placeholder="请输入姓名" />
        </a-form-item>
        <a-form-item label="性别">
          <a-select v-model:value="formState.gender" placeholder="请选择性别">
            <a-select-option value="男">男</a-select-option>
            <a-select-option value="女">女</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="班级">
          <a-input v-model:value="formState.className" placeholder="请输入班级" />
        </a-form-item>
        <a-form-item label="专业">
          <a-input v-model:value="formState.major" placeholder="请输入专业" />
        </a-form-item>
        <a-form-item label="电话">
          <a-input v-model:value="formState.phone" placeholder="请输入电话" />
        </a-form-item>
        <a-form-item label="身份证号">
          <a-input v-model:value="formState.idCard" placeholder="请输入身份证号" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formState.status" placeholder="请选择状态">
            <a-select-option value="在校">在校</a-select-option>
            <a-select-option value="离校">离校</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import request from '../../utils/request'

// 搜索表单
const searchForm = reactive({
  studentNo: '',
  name: '',
  className: ''
})

// 表格列定义
const columns = [
  { title: '学号', dataIndex: 'studentNo', key: 'studentNo' },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '性别', dataIndex: 'gender', key: 'gender' },
  { title: '班级', dataIndex: 'className', key: 'className' },
  { title: '专业', dataIndex: 'major', key: 'major' },
  { title: '电话', dataIndex: 'phone', key: 'phone' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', width: 180 }
]

// 表格数据
const dataSource = ref([])
const loading = ref(false)
const selectedRowKeys = ref([])

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 条`
})

// 弹窗
const modalVisible = ref(false)
const modalTitle = ref('新增学生')
const formState = reactive({
  id: null,
  studentNo: '',
  name: '',
  gender: '男',
  className: '',
  major: '',
  phone: '',
  idCard: '',
  status: '在校'
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/student/page', {
      params: {
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
        ...searchForm
      }
    })
    dataSource.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载数据失败：', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    studentNo: '',
    name: '',
    className: ''
  })
  handleSearch()
}

// 表格变化
const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

// 选择行
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 新增
const handleAdd = () => {
  modalTitle.value = '新增学生'
  Object.assign(formState, {
    id: null,
    studentNo: '',
    name: '',
    gender: '男',
    className: '',
    major: '',
    phone: '',
    idCard: '',
    status: '在校'
  })
  modalVisible.value = true
}

// 编辑
const handleEdit = (record) => {
  modalTitle.value = '编辑学生'
  Object.assign(formState, record)
  modalVisible.value = true
}

// 提交
const handleSubmit = async () => {
  try {
    if (formState.id) {
      await request.put('/student', formState)
      message.success('修改成功')
    } else {
      await request.post('/student', formState)
      message.success('添加成功')
    }
    modalVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败：', error)
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
}

// 删除
const handleDelete = async (id) => {
  try {
    await request.delete(`/student/${id}`)
    message.success('删除成功')
    loadData()
  } catch (error) {
    console.error('删除失败：', error)
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要删除的数据')
    return
  }
  request.delete('/student/batch', {
    data: selectedRowKeys.value
  }).then(() => {
    message.success('批量删除成功')
    selectedRowKeys.value = []
    loadData()
  }).catch(error => {
    console.error('批量删除失败：', error)
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.student-page {
  .search-form {
    margin-bottom: 16px;
  }

  .action-bar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
  }
}
</style>

