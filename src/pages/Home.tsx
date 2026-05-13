import React, { useState, useEffect, useMemo } from 'react'
import {
  Card, Row, Col, Space, Typography, Tag, Button, Statistic, List, Radio, message, Modal, Checkbox, Divider, Select
} from 'antd'
import {
  FileTextOutlined,
  CameraOutlined,
  HistoryOutlined,
  CarOutlined,
  RightOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  BellOutlined,
  RobotOutlined,
  DropboxOutlined,
  GoldOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { Vehicle, MaintenanceRecord, Reminder, MileageCheckpoint, FuelRecord } from '../types'

const { Title, Text } = Typography

// 常规保养里程间隔选项
const MILEAGE_INTERVAL_OPTIONS = [
  { label: '5000 km', value: 5000 },
  { label: '10000 km', value: 10000 },
]

// 生成间隔对应的里程选项列表（用于下拉选择）
const generateMileageOptions = (interval: number) => {
  const options = []
  for (let m = interval; m <= 500000; m += interval) {
    options.push({ label: `${m.toLocaleString()} km`, value: m })
  }
  return options
}

const MILEAGE_5000_OPTIONS = generateMileageOptions(5000)
const MILEAGE_10000_OPTIONS = generateMileageOptions(10000)

// 根据当前里程和间隔生成保养节点
// 逻辑：始终包含当前里程所在的"当前节点"，并往后延伸3个节点
const generateCheckpoints = (
  currentMileage: number,
  interval: number,
  existing: MileageCheckpoint[]
): MileageCheckpoint[] => {
  const points: MileageCheckpoint[] = []
  // 计算当前里程所在的保养节点（向上取整到最近的间隔倍数）
  const currentPoint = Math.ceil(currentMileage / interval) * interval
  const maxPoint = currentPoint + interval * 3
  for (let m = currentPoint; m <= maxPoint; m += interval) {
    const existingPoint = existing.find(p => p.mileage === m)
    points.push(existingPoint || { mileage: m, completed: false })
  }
  return points
}

interface HomePageProps {
  currentVehicle: Vehicle
  vehicles: Vehicle[]
  records: MaintenanceRecord[]
  reminders: Reminder[]
  fuelRecords: FuelRecord[]
  checkpoints: MileageCheckpoint[]
  onVehicleChange: (vehicle: Vehicle) => void
  onAddReminder: (reminder: Reminder) => void
  onFuelRecordsChange: (updater: FuelRecord[] | ((prev: FuelRecord[]) => FuelRecord[])) => void
  onCheckpointsChange: (checkpoints: MileageCheckpoint[]) => void
}

const HomePage: React.FC<HomePageProps> = ({
  currentVehicle,
  vehicles,
  records,
  reminders,
  fuelRecords,
  checkpoints,
  onVehicleChange,
  onAddReminder,
  onFuelRecordsChange,
  onCheckpointsChange
}) => {
  const navigate = useNavigate()
  // 保养间隔从车辆信息读取
  const mileageInterval = currentVehicle?.mileageInterval || 10000

  const vehicleRecords = records.filter(r => r.vehicleId === currentVehicle?._id)
  const recentRecords = vehicleRecords.slice(0, 5)
  const totalCost = vehicleRecords.reduce((sum, r) => sum + r.totalCost, 0)

  // 当前车辆的油耗记录（用于统计）
  const vehicleFuelRecords = useMemo(
    () => fuelRecords.filter(r => r.vehicleId === currentVehicle?._id),
    [fuelRecords, currentVehicle?._id]
  )
  const fuelStats = useMemo(() => {
    if (vehicleFuelRecords.length < 2) return null
    const sorted = [...vehicleFuelRecords].sort((a, b) => a.mileage - b.mileage)
    let totalFuel = 0, totalMileage = 0
    for (let i = 1; i < sorted.length; i++) {
      totalFuel += sorted[i].fuelAmount
      totalMileage += sorted[i].mileage - sorted[i - 1].mileage
    }
    return { avgConsumption: totalMileage > 0 ? (totalFuel / totalMileage * 100) : 0 }
  }, [vehicleFuelRecords])

  // 过滤半年内的保养提醒
  const today = new Date()
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(today.getMonth() - 6)
  const vehicleReminders = reminders
    .filter(r => r.vehicleId === currentVehicle?._id)
    .filter(r => new Date(r.nextDate) >= sixMonthsAgo)
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())

  const actionItems = [
    { icon: <FileTextOutlined />, title: '手动记录', path: '/manual', color: '#1677FF' },
    { icon: <CameraOutlined />, title: '拍照记录', path: '/photo', color: '#52C41A' },
    { icon: <HistoryOutlined />, title: '履历查询', path: '/history', color: '#FAAD14' }
  ]

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case '保养': return 'success'
      case '维修': return 'warning'
      case '更换配件': return 'processing'
      default: return 'default'
    }
  }

  if (!currentVehicle) {
    return (
      <Card>
        <Space direction="vertical" align="center" style={{ width: '100%', padding: '60px 0' }}>
          <CarOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <Title level={4} style={{ color: '#595959', marginBottom: 8 }}>请先添加车辆</Title>
          <Text type="secondary">添加车辆后即可开始记录保养信息</Text>
          <Button type="primary" onClick={() => navigate('/vehicle')} style={{ marginTop: 24 }}>
            添加车辆
          </Button>
        </Space>
      </Card>
    )
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 车辆信息卡片 */}
      <Card hoverable onClick={() => navigate('/vehicle')}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={8}>
              <Space>
                <CarOutlined style={{ fontSize: 24, color: '#1677FF' }} />
                <Title level={4} style={{ margin: 0 }}>{currentVehicle.plateNumber}</Title>
              </Space>
              <Text type="secondary">{currentVehicle.vehicleModel}</Text>
            </Space>
          </Col>
          <Col>
            <RightOutlined style={{ color: '#8C8C8C', fontSize: 16 }} />
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card><Statistic title="记录总数" value={vehicleRecords.length} suffix="条" /></Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="累计费用" value={totalCost} precision={2} prefix="¥"
              valueStyle={{ color: '#1677FF' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="车辆数量" value={vehicles.length} suffix="辆" /></Card>
        </Col>
      </Row>

      {/* 养车助理入口 */}
      <Card hoverable onClick={() => navigate('/assistant')}
        style={{ borderRadius: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space>
            <RobotOutlined style={{ fontSize: 24, color: '#fff' }} />
            <Text strong style={{ fontSize: 18, color: '#fff' }}>养车助理</Text>
          </Space>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            有车的问题，随时问 AI 助理
          </Text>
          <Button type="primary" style={{ background: '#fff', color: '#764ba2', border: 'none', marginTop: 4 }} size="small">
            立即咨询
          </Button>
        </Space>
      </Card>

      {/* 油耗和油价入口 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card hoverable onClick={() => navigate('/fuel')}
            style={{ borderRadius: 8, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none', height: '100%' }}
            bodyStyle={{ padding: 16 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space>
                <DropboxOutlined style={{ fontSize: 22, color: '#fff' }} />
                <Text strong style={{ fontSize: 16, color: '#fff' }}>油耗记录</Text>
              </Space>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                {fuelStats ? `${fuelStats.avgConsumption.toFixed(1)} L/100km · ${vehicleFuelRecords.length} 条记录` : '记录加油，统计油耗'}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card hoverable onClick={() => navigate('/oilprice')}
            style={{ borderRadius: 8, background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', border: 'none', height: '100%' }}
            bodyStyle={{ padding: 16 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space>
                <GoldOutlined style={{ fontSize: 22, color: '#fff' }} />
                <Text strong style={{ fontSize: 16, color: '#fff' }}>油价查询</Text>
              </Space>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                本地油价，一键查询
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 保养周期追踪 */}
      <MileageTracker
        currentVehicle={currentVehicle}
        records={vehicleRecords}
        mileageInterval={mileageInterval}
        checkpoints={checkpoints}
        onCheckpointsChange={onCheckpointsChange}
      />

      {/* 快捷操作 */}
      <Card title="快捷操作">
        <Row gutter={16}>
          {actionItems.map((item) => (
            <Col span={8} key={item.path}>
              <Button type="default" icon={item.icon} onClick={() => navigate(item.path)}
                style={{ width: '100%', height: 64, fontSize: 15, color: '#262626', borderColor: '#d9d9d9' }}>
                {item.title}
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 保养提醒 */}
      <Card
        title={<Space><BellOutlined style={{ color: '#D48806' }} /><Text strong style={{ color: '#262626' }}>保养提醒</Text></Space>}
        extra={<Button type="link" onClick={() => navigate('/reminder')}>查看详情</Button>}
      >
        {vehicleReminders.length > 0 ? (
          <List dataSource={vehicleReminders.slice(0, 5)}
            renderItem={(item) => (
              <List.Item>
                <Space style={{ width: '100%' }}>
                  <Text strong style={{ flex: 1 }}>{item.project}</Text>
                  <Text type="secondary">{item.nextDate}</Text>
                </Space>
              </List.Item>
            )} />
        ) : (
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '20px 0' }}>
            暂无保养提醒
          </Text>
        )}
      </Card>

      {/* 最近记录 */}
      <Card
        title="最近记录"
        extra={<Button type="link" onClick={() => navigate('/history')}>查看全部</Button>}
      >
        {recentRecords.length > 0 ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {recentRecords.map((record) => (
              <Card key={record._id} size="small" hoverable
                onClick={() => navigate('/record-detail', { state: { recordId: record._id } })}
                style={{ cursor: 'pointer' }}>
                <Row justify="space-between" align="middle">
                  <Col flex="auto">
                    <Space direction="vertical" size={8}>
                      <Space>
                        <Text strong style={{ color: '#262626' }}>{record.date}</Text>
                        <Tag color={getRecordTypeColor(record.recordType)}>{record.recordType}</Tag>
                      </Space>
                      <Text style={{ color: '#595959' }}>{record.projects.map(p => p.name).join('、')}</Text>
                      <Space>
                        <EnvironmentOutlined style={{ color: '#8C8C8C' }} />
                        <Text type="secondary">{record.location}</Text>
                      </Space>
                    </Space>
                  </Col>
                  <Col>
                    <Statistic value={record.totalCost} precision={2} prefix="¥"
                      valueStyle={{ color: '#1677FF', fontSize: 18 }} />
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        ) : (
          <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px 0' }}>
            <ClockCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Text type="secondary">暂无保养记录</Text>
            <Button type="primary" onClick={() => navigate('/manual')}>添加第一条记录</Button>
          </Space>
        )}
      </Card>
    </Space>
  )
}

// ==================== 保养周期追踪组件（props 驱动）====================

interface MileageTrackerProps {
  currentVehicle: Vehicle
  records: MaintenanceRecord[]
  mileageInterval: number
  checkpoints: MileageCheckpoint[]
  onCheckpointsChange: (checkpoints: MileageCheckpoint[]) => void
}

const MileageTracker: React.FC<MileageTrackerProps> = ({
  currentVehicle,
  records,
  mileageInterval,
  checkpoints,
  onCheckpointsChange,
}) => {
  // 初始化：首次加载时根据传入的 checkpoints 和 mileageInterval 生成展示列表
  const displayCheckpoints = useMemo(() => {
    if (checkpoints.length === 0) {
      return generateCheckpoints(currentVehicle.mileage || 0, mileageInterval, [])
    }
    return checkpoints
  }, [checkpoints, currentVehicle.mileage, mileageInterval])

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingPoint, setEditingPoint] = useState<MileageCheckpoint | null>(null)
  const [editProjects, setEditProjects] = useState<string[]>([])
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [selectedMileage, setSelectedMileage] = useState<number | null>(null)

  // 切换完成状态（自动延伸节点）
  const toggleComplete = (mileage: number) => {
    const currentMileage = currentVehicle?.mileage || 0

    // 如果节点不存在（比如用户选了比当前里程小的节点），先创建它
    let baseList = displayCheckpoints
    if (!displayCheckpoints.some(cp => cp.mileage === mileage)) {
      baseList = [...displayCheckpoints, { mileage, completed: false }].sort((a, b) => a.mileage - b.mileage)
    }

    const updated = baseList.map(cp =>
      cp.mileage === mileage
        ? { ...cp, completed: !cp.completed, date: cp.completed ? undefined : new Date().toISOString().split('T')[0] }
        : cp
    )

    // 自动延伸：如果标记完成的是最后一个节点，往后新增一个节点
    let finalList = updated
    const lastPoint = updated[updated.length - 1]
    if (lastPoint?.completed && mileage === lastPoint.mileage) {
      const nextMileage = lastPoint.mileage + mileageInterval
      finalList = [...updated, { mileage: nextMileage, completed: false }]
    }

    onCheckpointsChange(finalList)
    const cp = finalList.find(p => p.mileage === mileage)
    if (cp?.completed) {
      message.success(`${mileage.toLocaleString()} km 保养已标记完成`)
    } else {
      message.info(`${mileage.toLocaleString()} km 保养标记为未完成`)
    }
  }

  // 打开编辑模态框
  const openEditModal = (cp: MileageCheckpoint) => {
    setEditingPoint(cp)
    setEditProjects(cp.projects || [])
    setEditDate(cp.date || new Date().toISOString().split('T')[0])
    setEditNotes(cp.notes || '')
    setEditModalOpen(true)
  }

  // 保存编辑
  const saveEdit = () => {
    if (!editingPoint) return
    const updated = displayCheckpoints.map(cp =>
      cp.mileage === editingPoint.mileage
        ? { ...cp, projects: editProjects, date: editDate, notes: editNotes }
        : cp
    )
    onCheckpointsChange(updated)
    setEditModalOpen(false)
    message.success('保养记录已更新')
  }

  const currentMileage = currentVehicle?.mileage || 0

  return (
    <>
      <Card
        title={
          <Space>
            <ToolOutlined style={{ color: '#1677FF' }} />
            <Text strong>保养周期追踪</Text>
          </Space>
        }
        size="small"
      >
        {/* 显示当前保养间隔（只读，从车辆信息读取） */}
        <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: '#8C8C8C' }}>
            保养间隔：{mileageInterval.toLocaleString()} km（在车辆管理中设置）
          </Text>
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        {/* 未保养区块 */}
        <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
          <Text strong style={{ fontSize: 14, color: '#FA8C16' }}>未保养</Text>

          {/* 只显示未保养的里程 */}
          <Space.Compact style={{ width: '100%' }}>
            <Select
              placeholder="选择保养里程"
              style={{ width: 'calc(100% - 100px)' }}
              size="middle"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toString().includes(input)
              }
              options={
                (mileageInterval === 5000 ? MILEAGE_5000_OPTIONS : MILEAGE_10000_OPTIONS)
                  .filter(opt => !displayCheckpoints.some(cp => cp.completed && cp.mileage === opt.value))
              }
              onChange={(value) => setSelectedMileage(value)}
            />
            <Button
              type="primary"
              size="middle"
              onClick={() => {
                if (selectedMileage) {
                  toggleComplete(selectedMileage)
                  setSelectedMileage(null)
                }
              }}
              disabled={!selectedMileage}
            >
              保养完成
            </Button>
          </Space.Compact>
        </Space>

        {/* 已保养区块 */}
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text strong style={{ fontSize: 14, color: '#52C41A' }}>已保养</Text>

          {displayCheckpoints.filter(cp => cp.completed).length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 120, overflow: 'auto' }}>
              {displayCheckpoints.filter(cp => cp.completed).map(cp => (
                <Tag key={cp.mileage} color="success" style={{ fontSize: 13, padding: '2px 8px' }}>
                  {cp.mileage.toLocaleString()} km
                </Tag>
              ))}
            </div>
          ) : (
            <Text type="secondary">暂无已保养记录</Text>
          )}
        </Space>
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title={`${editingPoint?.mileage.toLocaleString()} km 保养记录`}
        open={editModalOpen}
        onOk={saveEdit}
        onCancel={() => setEditModalOpen(false)}
        okText="保存"
        width={480}
      >
        <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
          <div>
            <Text strong>完成日期</Text>
            <input
              type="date" value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #D9D9D9', fontSize: 14 }}
            />
          </div>
          <div>
            <Text strong>保养项目</Text>
            <div style={{ marginTop: 8 }}>
              <Checkbox.Group value={editProjects} onChange={(values) => setEditProjects(values as string[])}>
                <Row gutter={[8, 8]}>
                  {['更换机油', '更换机滤', '更换空滤', '更换空调滤芯', '更换刹车油',
                    '更换变速箱油', '更换冷却液', '更换火花塞', '更换刹车片',
                    '轮胎换位', '四轮定位', '常规检查'].map(proj => (
                    <Col span={12} key={proj}><Checkbox value={proj}>{proj}</Checkbox></Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </div>
          </div>
          <div>
            <Text strong>备注</Text>
            <textarea
              value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
              placeholder="其他备注信息..." rows={3}
              style={{ display: 'block', width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 6, border: '1px solid #D9D9D9', fontSize: 14, resize: 'vertical' }}
            />
          </div>
        </Space>
      </Modal>
    </>
  )
}

export default HomePage
