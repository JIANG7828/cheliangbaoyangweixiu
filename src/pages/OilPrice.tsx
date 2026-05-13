import React, { useState, useEffect } from 'react'
import {
  Card, Typography, Space, Row, Col, Spin, Tag, Button,
  List, Divider, message, Modal, Select, Input
} from 'antd'
import {
  EnvironmentOutlined, SyncOutlined, ExclamationCircleOutlined,
  FireOutlined, ClockCircleOutlined
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

// 油价数据接口
interface OilPrice {
  type: string;
  price: number;
  unit: string;
}

interface OilPriceData {
  province: string;
  city?: string;
  prices: OilPrice[];
  updatedAt: string;
}

// 模拟油价数据（实际使用时替换为API调用）
const MOCK_OIL_PRICES: Record<string, OilPriceData> = {
  '广东省': {
    province: '广东省',
    city: '广州市',
    prices: [
      { type: '92#', price: 7.98, unit: '元/升' },
      { type: '95#', price: 8.65, unit: '元/升' },
      { type: '98#', price: 9.88, unit: '元/升' },
      { type: '0#', price: 7.72, unit: '元/升' }
    ],
    updatedAt: new Date().toLocaleString('zh-CN')
  },
  '北京市': {
    province: '北京市',
    prices: [
      { type: '92#', price: 8.05, unit: '元/升' },
      { type: '95#', price: 8.57, unit: '元/升' },
      { type: '98#', price: 9.55, unit: '元/升' },
      { type: '0#', price: 7.85, unit: '元/升' }
    ],
    updatedAt: new Date().toLocaleString('zh-CN')
  },
  '上海市': {
    province: '上海市',
    prices: [
      { type: '92#', price: 8.02, unit: '元/升' },
      { type: '95#', price: 8.54, unit: '元/升' },
      { type: '98#', price: 9.76, unit: '元/升' },
      { type: '0#', price: 7.80, unit: '元/升' }
    ],
    updatedAt: new Date().toLocaleString('zh-CN')
  },
  '浙江省': {
    province: '浙江省',
    city: '杭州市',
    prices: [
      { type: '92#', price: 7.95, unit: '元/升' },
      { type: '95#', price: 8.46, unit: '元/升' },
      { type: '98#', price: 9.65, unit: '元/升' },
      { type: '0#', price: 7.73, unit: '元/升' }
    ],
    updatedAt: new Date().toLocaleString('zh-CN')
  },
  '江苏省': {
    province: '江苏省',
    city: '南京市',
    prices: [
      { type: '92#', price: 7.93, unit: '元/升' },
      { type: '95#', price: 8.44, unit: '元/升' },
      { type: '98#', price: 9.58, unit: '元/升' },
      { type: '0#', price: 7.68, unit: '元/升' }
    ],
    updatedAt: new Date().toLocaleString('zh-CN')
  }
}

const OIL_TYPES = [
  { code: '92#', name: '92号汽油', desc: '适用于普通家用轿车' },
  { code: '95#', name: '95号汽油', desc: '适用于大多数中级车' },
  { code: '98#', name: '98号汽油', desc: '适用于高性能车型' },
  { code: '0#', name: '0号柴油', desc: '适用于柴油车' }
]

const OilPricePage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [priceData, setPriceData] = useState<OilPriceData | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string>('广东省')
  const [manualProvince, setManualProvince] = useState<string>('')
  const [showManual, setShowManual] = useState(false)

  // 获取地理位置
  const getLocation = () => {
    return new Promise<{ province: string; city?: string }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            // 使用免费的逆地理编码API
            const response = await fetch(
              `https://apis.map.qq.com/location/v1/reverse?latitude=${latitude}&longitude=${longitude}&key=OB4BZ-D4W3U-B7YV3-YPVN3-IBJWT-HZBTF`
            )
            const data = await response.json()
            if (data.status === 0 && data.result) {
              const address = data.result.address_component
              resolve({
                province: address.province,
                city: address.city
              })
            } else {
              reject(new Error('无法解析位置'))
            }
          } catch {
            // 使用默认位置
            resolve({ province: '广东省', city: '广州市' })
          }
        },
        () => {
          // 定位失败，使用默认
          resolve({ province: '广东省', city: '广州市' })
        },
        { timeout: 5000 }
      )
    })
  }

  // 加载油价数据
  const loadOilPrice = async (province: string) => {
    setLoading(true)
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800))

      // 实际项目中替换为真实API调用
      // const response = await fetch(`https://api.example.com/oil-price?province=${encodeURIComponent(province)}`)
      // const data = await response.json()

      const data = MOCK_OIL_PRICES[province] || MOCK_OIL_PRICES['广东省']
      setPriceData({
        ...data,
        updatedAt: new Date().toLocaleString('zh-CN')
      })
      setCurrentLocation(data.city || data.province)
    } catch {
      message.error('获取油价信息失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 自动定位并加载油价
  const handleAutoLocation = async () => {
    setLocationLoading(true)
    try {
      const location = await getLocation()
      setCurrentLocation(location.city || location.province)

      // 匹配省份数据
      const matchedProvince = Object.keys(MOCK_OIL_PRICES).find(
        p => location.province.includes(p) || p.includes(location.province.replace(/省|市/g, ''))
      )

      if (matchedProvince) {
        setSelectedProvince(matchedProvince)
        await loadOilPrice(matchedProvince)
      } else {
        setSelectedProvince('广东省')
        await loadOilPrice('广东省')
        message.info('未找到您所在省份的数据，已加载广东省油价')
      }
    } catch {
      message.warning('定位失败，已加载默认地区油价')
      await loadOilPrice('广东省')
    } finally {
      setLocationLoading(false)
    }
  }

  // 手动选择省份
  const handleProvinceChange = async (value: string) => {
    setSelectedProvince(value)
    await loadOilPrice(value)
  }

  // 手动输入省份
  const handleManualSearch = async () => {
    if (!manualProvince.trim()) {
      message.warning('请输入省份名称')
      return
    }
    setShowManual(false)
    await loadOilPrice(manualProvince.trim())
  }

  // 计算油费
  const calculateCost = (type: string, amount: number) => {
    const price = priceData?.prices.find(p => p.type === type)
    if (!price) return null
    return (price.price * amount).toFixed(2)
  }

  // 获取油品颜色
  const getOilColor = (type: string) => {
    switch (type) {
      case '92#': return '#52C41A'
      case '95#': return '#1677FF'
      case '98#': return '#722ED1'
      case '0#': return '#F5222D'
      default: return '#8C8C8C'
    }
  }

  // 组件挂载时自动获取位置
  useEffect(() => {
    handleAutoLocation()
  }, [])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* 定位和选择区域 */}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <EnvironmentOutlined style={{ color: '#1677FF', fontSize: 18 }} />
              <Text strong>当前位置</Text>
              {locationLoading ? (
                <Spin size="small" />
              ) : (
                <Tag color="blue">{currentLocation || '定位中...'}</Tag>
              )}
            </Space>
            <Button
              icon={<SyncOutlined />}
              onClick={handleAutoLocation}
              loading={locationLoading}
              size="small"
            >
              刷新位置
            </Button>
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">选择其他地区：</Text>
            <Space>
              <Select
                value={selectedProvince}
                onChange={handleProvinceChange}
                style={{ width: 160 }}
                options={Object.keys(MOCK_OIL_PRICES).map(p => ({ label: p, value: p }))}
              />
              <Button onClick={() => setShowManual(true)} size="small">
                其他地区
              </Button>
            </Space>
          </Space>
        </Space>
      </Card>

      {/* 油价信息卡片 */}
      {loading ? (
        <Card style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" tip="正在获取油价信息..." />
        </Card>
      ) : priceData ? (
        <>
          {/* 主油价展示 */}
          <Card
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: 'none'
            }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <FireOutlined style={{ fontSize: 24, color: '#fff' }} />
                  <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    {priceData.city || priceData.province}今日油价
                  </Title>
                </Space>
                <Tag icon={<ClockCircleOutlined />} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}>
                  {priceData.updatedAt}
                </Tag>
              </Space>

              <Row gutter={[16, 16]}>
                {priceData.prices.map((oil) => (
                  <Col span={12} key={oil.type}>
                    <Card
                      size="small"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                      bodyStyle={{ padding: '12px 16px' }}
                    >
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space>
                          <Tag color={getOilColor(oil.type)} style={{ margin: 0 }}>{oil.type}</Tag>
                        </Space>
                        <Text strong style={{ fontSize: 24, color: '#fff' }}>
                          {oil.price.toFixed(2)}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                          {oil.unit}
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Space>
          </Card>

          {/* 油品说明 */}
          <Card title="油品说明">
            <List
              dataSource={OIL_TYPES}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Tag color={getOilColor(item.code)} style={{ width: 48, textAlign: 'center' }}>
                        {item.code}
                      </Tag>
                    }
                    title={item.name}
                    description={item.desc}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* 油费计算器 */}
          <Card title="油费计算器">
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              根据当前油价计算加油费用
            </Paragraph>
            <Row gutter={16}>
              {priceData.prices.map((oil) => {
                const amount = oil.type === '0#' ? 50 : 50 // 默认50升
                const cost = calculateCost(oil.type, amount)
                return (
                  <Col span={12} key={oil.type} style={{ marginBottom: 12 }}>
                    <Card size="small" bodyStyle={{ padding: '12px' }}>
                      <Space>
                        <Tag color={getOilColor(oil.type)}>{oil.type}</Tag>
                        <Text>50升 = </Text>
                        <Text strong style={{ color: '#1677FF' }}>¥{cost}</Text>
                      </Space>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          </Card>

          {/* 温馨提示 */}
          <Card size="small" style={{ background: '#F6FFED', border: '1px solid #b7eb8f' }}>
            <Space>
              <ExclamationCircleOutlined style={{ color: '#52C41A' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                油价数据仅供参考，实际价格以加油站为准。数据更新可能存在延迟，建议出发前再次确认。
              </Text>
            </Space>
          </Card>
        </>
      ) : null}

      {/* 手动输入模态框 */}
      <Modal
        title="选择其他地区"
        open={showManual}
        onOk={handleManualSearch}
        onCancel={() => setShowManual(false)}
        okText="查询"
      >
        <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
          <Text type="secondary">输入省份或城市名称：</Text>
          <Input
            placeholder="如：广东省、四川省、深圳市"
            value={manualProvince}
            onChange={(e) => setManualProvince(e.target.value)}
            onPressEnter={handleManualSearch}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            注：目前支持以下省份数据：广东省、北京市、上海市、浙江省、江苏省
          </Text>
        </Space>
      </Modal>
    </Space>
  )
}

export default OilPricePage
