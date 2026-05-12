import React, { useState, useCallback, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Space,
  Typography,
  Row,
  Col,
  message,
  Tag,
  Popconfirm,
  Empty
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import { MaintenanceRecord, MaintenanceProject } from '../types'

const { Text, Title } = Typography

interface RecordDetailPageProps {
  records: MaintenanceRecord[]
  vehicles: any[]
  onUpdateRecord: (record: MaintenanceRecord) => void
  onDeleteRecord: (recordId: string) => void
}

const RecordDetailPage: React.FC<RecordDetailPageProps> = ({
  records,
  vehicles,
  onUpdateRecord,
  onDeleteRecord
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()
  const [isEditing, setIsEditing] = useState(false)
  const [projects, setProjects] = useState<MaintenanceProject[]>([])
  const [projectNameInput, setProjectNameInput] = useState('')
  const [projectCostInput, setProjectCostInput] = useState('')
  const [recordData, setRecordData] = useState<MaintenanceRecord | null>(null)

  useEffect(() => {
    const recordId = location.state?.recordId
    const found = records.find(r => r._id === recordId)
    if (found) {
      setRecordData(found)
      setProjects(found.projects)
      form.setFieldsValue({
        date: dayjs(found.date),
        location: found.location,
        mechanic: found.mechanic,
        recordType: found.recordType
      })
    }
  }, [location.state?.recordId, records, form])

  const totalCost = projects.reduce((sum, p) => sum + (p.cost || 0), 0)

  const addProject = useCallback(() => {
    if (!projectNameInput) {
      message.warning('请输入项目名称')
      return
    }
    const cost = parseFloat(projectCostInput) || 0
    if (cost <= 0) {
      message.warning('请输入金额')
      return
    }
    setProjects(prev => [...prev, { name: projectNameInput, cost }])
    setProjectNameInput('')
    setProjectCostInput('')
  }, [projectNameInput, projectCostInput])

  const removeProject = useCallback((index: number) => {
    setProjects(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = (values: any) => {
    if (projects.length === 0) {
      message.warning('请至少保留一个项目')
      return
    }

    const updatedRecord: MaintenanceRecord = {
      ...recordData!,
      date: values.date.format('YYYY-MM-DD HH:mm'),
      location: values.location || '',
      projects,
      totalCost,
      mechanic: values.mechanic || '',
      recordType: values.recordType || recordData!.recordType
    }

    onUpdateRecord(updatedRecord)
    setIsEditing(false)
    message.success('保存成功')
  }

  const handleDelete = () => {
    onDeleteRecord(recordData!._id)
    message.success('删除成功')
    setTimeout(() => navigate('/history'), 500)
  }

  const handleCancel = () => {
    if (recordData) {
      setIsEditing(false)
      setProjects(recordData.projects)
      form.setFieldsValue({
        date: dayjs(recordData.date),
        location: recordData.location,
        mechanic: recordData.mechanic,
        recordType: recordData.recordType
      })
    }
  }

  if (!recordData) {
    return (
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/history')}
          type="text"
        >
          返回列表
        </Button>
        <Card>
          <Empty description="记录不存在或已被删除" />
        </Card>
      </Space>
    )
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/history')}
            type="text"
          >
            返回列表
          </Button>
        </Col>
        <Col>
          <Space>
            {!isEditing ? (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                编辑
              </Button>
            ) : (
              <Space>
                <Button onClick={handleCancel}>取消</Button>
                <Button type="primary" onClick={() => form.submit()}>
                  保存
                </Button>
              </Space>
            )}
            <Popconfirm
              title="确认删除此记录？"
              description="删除后无法恢复"
              onConfirm={handleDelete}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <Text strong style={{ fontSize: 16, color: '#262626' }}>
              保养记录详情
            </Text>
            <Tag color={recordData.recordType === '保养' ? 'green' : 'orange'}>
              {recordData.recordType}
            </Tag>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="时间">
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  disabled={!isEditing}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="地点">
                <Input
                  placeholder="保养/维修地点"
                  disabled={!isEditing}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="recordType" label="类型">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mechanic" label="维修人员">
                <Input
                  placeholder="维修人员姓名"
                  disabled={!isEditing}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="项目明细">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {projects.length > 0 && (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {projects.map((project, index) => (
                    <Row
                      key={index}
                      align="middle"
                      style={{
                        padding: '12px 16px',
                        background: '#fafafa',
                        borderRadius: 6
                      }}
                    >
                      <Col span={2}>
                        <Text type="secondary">{index + 1}.</Text>
                      </Col>
                      <Col span={10}>
                        <Text strong style={{ color: '#262626' }}>{project.name}</Text>
                      </Col>
                      <Col span={6}>
                        <Space>
                          <DollarOutlined style={{ color: '#595959', fontSize: 12 }} />
                          <Text style={{ color: '#1677FF', fontWeight: 'bold', fontSize: 15 }}>
                            {'\u00A5'}{project.cost.toFixed(2)}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        {isEditing && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeProject(index)}
                          />
                        )}
                      </Col>
                    </Row>
                  ))}
                </Space>
              )}

              {isEditing && (
                <Row gutter={12}>
                  <Col span={10}>
                    <Input
                      value={projectNameInput}
                      onChange={(e) => setProjectNameInput(e.target.value)}
                      placeholder="项目名称"
                      onPressEnter={addProject}
                    />
                  </Col>
                  <Col span={8}>
                    <Input
                      value={projectCostInput}
                      onChange={(e) => setProjectCostInput(e.target.value)}
                      placeholder="输入金额"
                      prefix="&yen;"
                      onPressEnter={addProject}
                    />
                  </Col>
                  <Col span={6}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={addProject}
                      disabled={!projectNameInput || !projectCostInput}
                      block
                    >
                      添加
                    </Button>
                  </Col>
                </Row>
              )}
            </Space>
          </Form.Item>

          <Form.Item label="总金额">
            <Card size="small" style={{ background: '#fafafa', borderRadius: 6 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text style={{ color: '#595959' }}>
                    共 {projects.length} 个项目
                  </Text>
                </Col>
                <Col>
                  <Title level={4} style={{ margin: 0, color: '#1677FF', fontWeight: 'bold' }}>
                    &yen;{totalCost.toFixed(2)}
                  </Title>
                </Col>
              </Row>
            </Card>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  )
}

export default RecordDetailPage