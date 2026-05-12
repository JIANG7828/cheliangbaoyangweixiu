import React, { useState } from 'react'
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Timeline,
  Alert,
  Statistic,
  Form,
  Input,
  DatePicker,
  Modal,
  message
} from 'antd'
import {
  RobotOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { AIPlan, Vehicle, MaintenanceRecord, Reminder } from '../types'

const { Text } = Typography

interface ReminderPageProps {
  currentVehicle: Vehicle
  records: MaintenanceRecord[]
  aiPlans: AIPlan[]
  onAddReminder: (reminder: Reminder) => void
}

const ReminderPage: React.FC<ReminderPageProps> = ({
  currentVehicle,
  records,
  aiPlans,
  onAddReminder
}) => {
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const urgentItems = aiPlans.filter(p => p.status === 'urgent')
  const upcomingItems = aiPlans.filter(p => p.status === 'upcoming')
  const plannedItems = aiPlans.filter(p => p.status === 'planned')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'error'
      case 'upcoming': return 'warning'
      case 'planned': return 'success'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'urgent': return '紧急'
      case 'upcoming': return '即将到期'
      case 'planned': return '计划中'
      default: return status
    }
  }

  const handleAddReminder = (values: any) => {
    const reminder: Reminder = {
      _id: Date.now().toString(),
      vehicleId: currentVehicle._id,
      project: values.project,
      nextDate: values.nextDate.format('YYYY-MM-DD'),
      nextMileage: values.nextMileage || undefined,
      notified: false
    }
    onAddReminder(reminder)
    message.success('添加成功')
    setIsModalOpen(false)
    form.resetFields()
  }

  const renderTimeline = (items: AIPlan[], color: string) => (
    <Timeline
      items={items.map((item) => ({
        color,
        children: (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space>
              <Text strong>{item.project}</Text>
              <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 13 }}>{item.desc}</Text>
            <Space>
              <CalendarOutlined />
              <Text type="secondary">{item.nextDate} | {item.daysUntil}天后</Text>
            </Space>
            <Text style={{ fontSize: 12, color: '#8C8C8C' }}>置信度: {item.confidence}</Text>
          </Space>
        )
      }))}
    />
  )

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* AI智能保养意见 */}
      <Card
        title={
          <Space>
            <RobotOutlined style={{ color: '#1677FF' }} />
            <Text strong style={{ color: '#262626' }}>AI智能保养意见</Text>
          </Space>
        }
      >
        <Alert
          message="AI已根据车辆使用情况和历史记录自动生成保养建议，记录更新后将自动重新生成"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card style={{ borderColor: '#ff4d4f', borderWidth: 1 }}>
              <Statistic
                title="紧急"
                value={urgentItems.length}
                valueStyle={{ color: '#FF4D4F' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ borderColor: '#faad14', borderWidth: 1 }}>
              <Statistic
                title="即将到期"
                value={upcomingItems.length}
                valueStyle={{ color: '#D48806' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ borderColor: '#52c41a', borderWidth: 1 }}>
              <Statistic
                title="计划中"
                value={plannedItems.length}
                valueStyle={{ color: '#52C41A' }}
              />
            </Card>
          </Col>
        </Row>

        {aiPlans.length > 0 ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {urgentItems.length > 0 && (
              <Card
                size="small"
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong style={{ color: '#ff4d4f' }}>紧急</Text>
                  </Space>
                }
                style={{ borderColor: '#ff4d4f', borderWidth: 1, background: '#fff2f0' }}
              >
                {renderTimeline(urgentItems, 'red')}
              </Card>
            )}

            {upcomingItems.length > 0 && (
              <Card
                size="small"
                title={
                  <Space>
                    <BellOutlined style={{ color: '#faad14' }} />
                    <Text strong style={{ color: '#faad14' }}>即将到期</Text>
                  </Space>
                }
                style={{ borderColor: '#faad14', borderWidth: 1, background: '#fffbe6' }}
              >
                {renderTimeline(upcomingItems, 'orange')}
              </Card>
            )}

            {plannedItems.length > 0 && (
              <Card
                size="small"
                title={
                  <Space>
                    <CalendarOutlined style={{ color: '#52c41a' }} />
                    <Text strong style={{ color: '#52c41a' }}>计划中</Text>
                  </Space>
                }
                style={{ borderColor: '#52c41a', borderWidth: 1, background: '#f6ffed' }}
              >
                {renderTimeline(plannedItems, 'green')}
              </Card>
            )}

            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} block>
              手动添加提醒
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px 0' }}>
            <ThunderboltOutlined style={{ fontSize: 48, color: '#1677FF' }} />
            <Text type="secondary">点击「重新生成」获取AI保养计划</Text>
          </Space>
        )}
      </Card>

      <Modal
        title="添加保养提醒"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddReminder}
        >
          <Form.Item
            name="project"
            label="保养项目"
            rules={[{ required: true, message: '请输入保养项目' }]}
          >
            <Input placeholder="例如：更换机油" />
          </Form.Item>

          <Form.Item
            name="nextDate"
            label="下次保养日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="nextMileage" label="下次保养里程（可选）">
            <Input placeholder="输入里程数" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default ReminderPage