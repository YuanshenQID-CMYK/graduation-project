<template>
  <div class="notice-page">
    <a-card>
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="标题">
          <a-input v-model:value="searchForm.title" placeholder="请输入标题" allow-clear />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="searchForm.type" placeholder="请选择类型" allow-clear style="width: 150px">
            <a-select-option value="通知">通知</a-select-option>
            <a-select-option value="公告">公告</a-select-option>
            <a-select-option value="新闻">新闻</a-select-option>
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
          新增公告
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
            <a-tag>{{ record.type }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'success' : 'default'">
              {{ record.status === 1 ? '已发布' : '草稿' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleView(record)">
                查看
              </a-button>
              <a-button v-if="record.status === 0" type="link" size="small" @click="handlePublish(record.id)">
                发布
              </a-button>
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
      width="800px"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
    >
      <a-form :model="formState" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <a-form-item label="标题" required>
          <a-input v-model:value="formState.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item label="类型" required>
          <a-select v-model:value="formState.type" placeholder="请选择类型">
            <a-select-option value="通知">通知</a-select-option>
            <a-select-option value="公告">公告</a-select-option>
            <a-select-option value="新闻">新闻</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="内容" required>
          <a-textarea v-model:value="formState.content" placeholder="请输入内容" :rows="10" />
        </a-form-item>
        <a-form-item label="发布人">
          <a-input v-model:value="formState.publisher" placeholder="请输入发布人" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model:value="formState.status">
            <a-radio :value="0">草稿</a-radio>
            <a-radio :value="1">发布</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情弹窗 -->
    <a-modal v-model:open="viewModalVisible" title="公告详情" :footer="null" width="800px">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="标题">{{ currentRecord.title }}</a-descriptions-item>
        <a-descriptions-item label="类型">
          <a-tag>{{ currentRecord.type }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="内容">
          <div v-html="currentRecord.content"></div>
        </a-descriptions-item>
        <a-descriptions-item label="发布人">{{ currentRecord.publisher }}</a-descriptions-item>
        <a-descriptions-item label="浏览次数">{{ currentRecord.viewCount || 0 }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ currentRecord.createTime }}</a-descriptions-item>
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
  title: '',
  type: undefined
})

const columns = [
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '发布人', dataIndex: 'publisher', key: 'publisher' },
  { title: '浏览次数', dataIndex: 'viewCount', key: 'viewCount' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
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

const modalVisible = ref(false)
const viewModalVisible = ref(false)
const modalTitle = ref('新增公告')
const currentRecord = ref({})

const formState = reactive({
  id: null,
  title: '',
  type: '通知',
  content: '',
  publisher: '系统管理员',
  status: 0
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/notice/page', {
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
  Object.assign(searchForm, { title: '', type: undefined })
  handleSearch()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const handleAdd = () => {
  modalTitle.value = '新增公告'
  Object.assign(formState, {
    id: null,
    title: '',
    type: '通知',
    content: '',
    publisher: '系统管理员',
    status: 0
  })
  modalVisible.value = true
}

const handleEdit = (record) => {
  modalTitle.value = '编辑公告'
  Object.assign(formState, record)
  modalVisible.value = true
}

const handleSubmit = async () => {
  try {
    if (formState.id) {
      await request.put('/notice', formState)
      message.success('修改成功')
    } else {
      await request.post('/notice', formState)
      message.success('添加成功')
    }
    modalVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败：', error)
  }
}

const handleView = (record) => {
  currentRecord.value = record
  viewModalVisible.value = true
}

const handlePublish = async (id) => {
  try {
    await request.post(`/notice/publish/${id}`)
    message.success('发布成功')
    loadData()
  } catch (error) {
    console.error('发布失败：', error)
  }
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/notice/${id}`)
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
.notice-page {
  .search-form {
    margin-bottom: 16px;
  }

  .action-bar {
    margin-bottom: 16px;
  }
}
</style>

