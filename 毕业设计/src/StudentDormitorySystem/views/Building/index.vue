<template>
  <div class="building-page">
    <a-card>
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="楼栋号">
          <a-input v-model:value="searchForm.buildingNo" placeholder="请输入楼栋号" allow-clear />
        </a-form-item>
        <a-form-item label="楼栋名称">
          <a-input v-model:value="searchForm.buildingName" placeholder="请输入楼栋名称" allow-clear />
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
          新增楼栋
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
            <a-tag :color="record.type === '男生宿舍' ? 'blue' : 'pink'">
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
      @cancel="handleCancel"
    >
      <a-form :model="formState" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="楼栋号" required>
          <a-input v-model:value="formState.buildingNo" placeholder="请输入楼栋号" />
        </a-form-item>
        <a-form-item label="楼栋名称" required>
          <a-input v-model:value="formState.buildingName" placeholder="请输入楼栋名称" />
        </a-form-item>
        <a-form-item label="楼层数">
          <a-input-number v-model:value="formState.floors" :min="1" placeholder="请输入楼层数" style="width: 100%" />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="formState.type" placeholder="请选择类型">
            <a-select-option value="男生宿舍">男生宿舍</a-select-option>
            <a-select-option value="女生宿舍">女生宿舍</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="负责人">
          <a-input v-model:value="formState.manager" placeholder="请输入负责人" />
        </a-form-item>
        <a-form-item label="负责人电话">
          <a-input v-model:value="formState.managerPhone" placeholder="请输入负责人电话" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="formState.description" placeholder="请输入描述" :rows="3" />
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
  PlusOutlined
} from '@ant-design/icons-vue'
import request from '../../utils/request'

const searchForm = reactive({
  buildingNo: '',
  buildingName: ''
})

const columns = [
  { title: '楼栋号', dataIndex: 'buildingNo', key: 'buildingNo' },
  { title: '楼栋名称', dataIndex: 'buildingName', key: 'buildingName' },
  { title: '楼层数', dataIndex: 'floors', key: 'floors' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '负责人', dataIndex: 'manager', key: 'manager' },
  { title: '负责人电话', dataIndex: 'managerPhone', key: 'managerPhone' },
  { title: '操作', key: 'action', width: 180 }
]

const dataSource = ref([])
const loading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 条`
})

const modalVisible = ref(false)
const modalTitle = ref('新增楼栋')
const formState = reactive({
  id: null,
  buildingNo: '',
  buildingName: '',
  floors: 1,
  type: '男生宿舍',
  manager: '',
  managerPhone: '',
  description: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/building/page', {
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

const handleSearch = () => {
  pagination.current = 1
  loadData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    buildingNo: '',
    buildingName: ''
  })
  handleSearch()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const handleAdd = () => {
  modalTitle.value = '新增楼栋'
  Object.assign(formState, {
    id: null,
    buildingNo: '',
    buildingName: '',
    floors: 1,
    type: '男生宿舍',
    manager: '',
    managerPhone: '',
    description: ''
  })
  modalVisible.value = true
}

const handleEdit = (record) => {
  modalTitle.value = '编辑楼栋'
  Object.assign(formState, record)
  modalVisible.value = true
}

const handleSubmit = async () => {
  try {
    if (formState.id) {
      await request.put('/building', formState)
      message.success('修改成功')
    } else {
      await request.post('/building', formState)
      message.success('添加成功')
    }
    modalVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败：', error)
  }
}

const handleCancel = () => {
  modalVisible.value = false
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/building/${id}`)
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
.building-page {
  .search-form {
    margin-bottom: 16px;
  }

  .action-bar {
    margin-bottom: 16px;
  }
}
</style>

