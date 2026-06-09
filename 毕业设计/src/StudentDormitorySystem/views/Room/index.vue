<template>
  <div class="room-page">
    <a-card>
      <!-- 搜索栏 -->
      <a-form layout="inline" :model="searchForm" class="search-form">
        <a-form-item label="所属楼栋">
          <a-select
            v-model:value="searchForm.buildingId"
            placeholder="请选择楼栋"
            allow-clear
            style="width: 200px"
          >
            <a-select-option v-for="item in buildingList" :key="item.id" :value="item.id">
              {{ item.buildingName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="房间号">
          <a-input v-model:value="searchForm.roomNo" placeholder="请输入房间号" allow-clear />
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
          新增房间
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
          <template v-if="column.key === 'buildingId'">
            {{ getBuildingName(record.buildingId) }}
          </template>
          <template v-else-if="column.key === 'beds'">
            <a-tag :color="record.availableBeds > 0 ? 'success' : 'error'">
              {{ record.availableBeds }} / {{ record.bedCount }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === '正常' ? 'success' : 'warning'">
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
        <a-form-item label="所属楼栋" required>
          <a-select v-model:value="formState.buildingId" placeholder="请选择楼栋">
            <a-select-option v-for="item in buildingList" :key="item.id" :value="item.id">
              {{ item.buildingName }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="房间号" required>
          <a-input v-model:value="formState.roomNo" placeholder="请输入房间号" />
        </a-form-item>
        <a-form-item label="楼层">
          <a-input-number v-model:value="formState.floor" :min="1" placeholder="请输入楼层" style="width: 100%" />
        </a-form-item>
        <a-form-item label="床位总数">
          <a-input-number v-model:value="formState.bedCount" :min="1" placeholder="请输入床位总数" style="width: 100%" />
        </a-form-item>
        <a-form-item label="剩余床位">
          <a-input-number v-model:value="formState.availableBeds" :min="0" placeholder="请输入剩余床位" style="width: 100%" />
        </a-form-item>
        <a-form-item label="房间类型">
          <a-input v-model:value="formState.type" placeholder="请输入房间类型" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="formState.status" placeholder="请选择状态">
            <a-select-option value="正常">正常</a-select-option>
            <a-select-option value="维修中">维修中</a-select-option>
          </a-select>
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
  buildingId: undefined,
  roomNo: ''
})

const buildingList = ref([])

const columns = [
  { title: '所属楼栋', dataIndex: 'buildingId', key: 'buildingId' },
  { title: '房间号', dataIndex: 'roomNo', key: 'roomNo' },
  { title: '楼层', dataIndex: 'floor', key: 'floor' },
  { title: '床位情况', key: 'beds' },
  { title: '房间类型', dataIndex: 'type', key: 'type' },
  { title: '状态', dataIndex: 'status', key: 'status' },
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
const modalTitle = ref('新增房间')
const formState = reactive({
  id: null,
  buildingId: undefined,
  roomNo: '',
  floor: 1,
  bedCount: 4,
  availableBeds: 4,
  type: '标准间',
  status: '正常',
  description: ''
})

const getBuildingName = (buildingId) => {
  const building = buildingList.value.find(item => item.id === buildingId)
  return building ? building.buildingName : '-'
}

const loadBuildingList = async () => {
  try {
    const res = await request.get('/building/list')
    buildingList.value = res.data || []
  } catch (error) {
    console.error('加载楼栋列表失败：', error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await request.get('/room/page', {
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
    buildingId: undefined,
    roomNo: ''
  })
  handleSearch()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

const handleAdd = () => {
  modalTitle.value = '新增房间'
  Object.assign(formState, {
    id: null,
    buildingId: undefined,
    roomNo: '',
    floor: 1,
    bedCount: 4,
    availableBeds: 4,
    type: '标准间',
    status: '正常',
    description: ''
  })
  modalVisible.value = true
}

const handleEdit = (record) => {
  modalTitle.value = '编辑房间'
  Object.assign(formState, record)
  modalVisible.value = true
}

const handleSubmit = async () => {
  try {
    if (formState.id) {
      await request.put('/room', formState)
      message.success('修改成功')
    } else {
      await request.post('/room', formState)
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
    await request.delete(`/room/${id}`)
    message.success('删除成功')
    loadData()
  } catch (error) {
    console.error('删除失败：', error)
  }
}

onMounted(() => {
  loadBuildingList()
  loadData()
})
</script>

<style scoped lang="scss">
.room-page {
  .search-form {
    margin-bottom: 16px;
  }

  .action-bar {
    margin-bottom: 16px;
  }
}
</style>

