import React, { useState, useMemo } from 'react'
import {
  Card, Form, Input, InputNumber, DatePicker, Switch, Button,
  Space, Typography, List, Tag, Statistic, Row, Col, message, Modal, Empty
} from 'antd'
import {
  DeleteOutlined, EditOutlined, PlusOutlined, CarOutlined,
  EnvironmentOutlined, CalendarOutlined, DollarOutlined
} from '@ant-design/icons'
import { FuelRecord, Vehicle } from '../types'

const { Text } = Typography

interface FuelRecordPageProps {
  currentVehicle: Vehicle
  fuelRecords: FuelRecord[]
  onFuelRecordsChange: (updater: FuelRecord[] | ((prev: FuelRecord[]) => FuelRecord[])) => void
}

const FuelRecordPage: React.FC<FuelRecordPageProps> = ({
  currentVehicle,
  fuelRecords,
  onFuelRecordsChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)
  const [form] = Form.useForm()

  // 当前车辆的油耗记录（从 App 传入，已是按账号隔离的数据）
  const records = useMemo(
    () => fuelRecords
      .filter(r => r.vehicleId === currentVehicle._id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [fuelRecords, currentVehicle._id]
  )

  // 统计数据（纯计算，不维护 state）
  const stats = useMemo(() => {
    if (records.length < 2) {
      return { avgConsumption: 0, totalCost: 0, totalFuel: 0, totalMileage: 0 }
    }
    const sorted = [...records].sort((a, b) => a.mileage - b.mileage)
    let totalFuel = 0
    let totalMileage = 0
    for (let i = 1; i < sorted.length; i++) {
      totalFuel += sorted[i].fuelAmount
      totalMileage += sorted[i].mileage - sorted[i - 1].mileage
    }
    return {
      avgConsumption: totalMileage > 0 ? (totalFuel / totalMileage * 100) : 0,
      totalCost: records.reduce((sum, r) => sum + r.totalCost, 0),
      totalFuel: records.reduce((sum, r) => sum + r.fuelAmount, 0),
      totalMileage,
    }
  }, [records])

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      date: new Date().toISOString().split('T')[0],
      mileage: currentVehicle.mileage || 0,
      fullTank: true
    })
    setIsModalOpen(true)
  }

  const handleEdit = (record: FuelRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({ ...record, date: record.date })
    setIsModalOpen(true)
  }

  const handleDelete = (record: FuelRecord) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条加油记录吗？',
      onOk: () => {
        onFuelRecordsChange(prev => prev.filter(r => r._id !== record._id))
        message.success('已删除')
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const record: FuelRecord = {
        _id: editingRecord?._id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        vehicleId: currentVehicle._id,
        date: values.date,
        mileage: values.mileage,
        fuelAmount: values.fuelAmount,
        price: values.price,
        totalCost: values.fuelAmount * values.price,
        fullTank: values.fullTank,
        location: values.location,
        notes: values.notes,
      }
      if (editingRecord) {
        onFuelRecordsChange(prev => prev.map(r => r._id === record._id ? record : r))
      } else {
        // 插入排序后位置
        const newRecords = [record, ...records]
        onFuelRecordsChange(prev => {
          const without = prev.filter(r => r.vehicleId !== currentVehicle._id)
          return [...without, ...newRecords]
        })
      }
      setIsModalOpen(false)
      message.success(editingRecord ? '已更新' : '已添加')
    } catch {
      // 表单验证失败
    }
  }

  const getMileageDiff = (index: number) => {
    if (index >= records.length - 1) return null
    const sorted = [...records].sort((a, b) => a.mileage - b.mileage)
    const currentIdx = sorted.findIndex(r => r._id === records[index]._id)
    if (currentIdx <= 0) return null
    return sorted[currentIdx].mileage - sorted[currentIdx - 1].mileage
  }

  const getFuelConsumption = (index: number) => {
    const diff = getMileageDiff(index)
    if (!diff || diff <= 0) return null
    const fuel = records[index].fuelAmount
    return (fuel / diff * 100).toFixed(2)
  }

  if (!currentVehicle) {
    return <Empty description="请先添加车辆" />
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="平均油耗"
              value={stats.avgConsumption}
              precision={2}
              suffix="L/100km"
              valueStyle={{ color: '#1677FF', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="累计加油"
              value={stats.totalFuel}
              precision={1}
              suffix="升"
              valueStyle={{ color: '#52C41A', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="累计里程"
              value={stats.totalMileage}
              precision={0}
              suffix="公里"
              valueStyle={{ color: '#FAAD14', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="累计费用"
              value={stats.totalCost}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#F5222D', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* AI分析提示 */}
      {records.length >= 3 && (
        <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
          <Space>
            <CarOutlined style={{ fontSize: 20, color: '#fff' }} />
            <Text strong style={{ color: '#fff' }}>
              已记录 {records.length} 次加油，平均油耗 {stats.avgConsumption.toFixed(2)} L/100km
            </Text>
          </Space>
          <Text style={{ display: 'block', color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 }}>
            油耗数据将帮助养车助理更准确地分析您的车辆性能
          </Text>
        </Card>
      )}

      {/* 添加按钮 */}
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ width: '100%' }}>
        记录加油
      </Button>

      {/* 加油记录列表 */}
      <Card title="加油记录">
        {records.length > 0 ? (
          <List
            dataSource={records}
            renderItem={(record, index) => (
              <List.Item
                actions={[
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />,
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: record.fullTank ? '#E6F7FF' : '#FFF7E6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: record.fullTank ? '#1677FF' : '#FA8C16'
                    }}>
                      {record.fullTank ? '满箱' : '补油'}
                    </div>
                  }
                  title={
                    <Space>
                      <CalendarOutlined />
                      <Text>{record.date}</Text>
                      <Tag color="blue">{record.mileage.toLocaleString()} km</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Space>
                        <Text type="secondary">
                          <DollarOutlined /> {record.fuelAmount} L × ¥{record.price} = ¥{record.totalCost.toFixed(2)}
                        </Text>
                      </Space>
                      {record.location && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <EnvironmentOutlined /> {record.location}
                        </Text>
                      )}
                    </Space>
                  }
                />
                {getFuelConsumption(index) && (
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    {getFuelConsumption(index)} L/100km
                  </Tag>
                )}
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无加油记录" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={handleAdd}>添加第一条记录</Button>
          </Empty>
        )}
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑加油记录' : '记录加油'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="保存"
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="date" label="加油日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>

          <Form.Item name="mileage" label="当前里程（公里）" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={0} placeholder="如：50000" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fuelAmount" label="加油量（升）" rules={[{ required: true, type: 'number', min: 0.1 }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={1} placeholder="如：45.5" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price" label="单价（元/升）" rules={[{ required: true, type: 'number', min: 0.01 }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="如：7.85" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="fullTank" label="是否加满" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item name="location" label="加油站（可选）">
            <Input placeholder="如：中石化 XX加油站" />
          </Form.Item>

          <Form.Item name="notes" label="备注（可选）">
            <Input.TextArea rows={2} placeholder="其他备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default FuelRecordPage
