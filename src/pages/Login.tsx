import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Tabs,
  Divider,
  QRCode,
  message,
  Modal,
  Alert
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  CarOutlined,
  WechatOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'

const { Text, Title } = Typography

interface LoginPageProps {
  onLogin: (user: { name: string }) => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<'input' | 'setPassword' | 'success'>('input')
  const [resetUsername, setResetUsername] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const getRegisteredUsers = (): Array<{ username: string; password: string }> => {
    try {
      const stored = localStorage.getItem('vmr_registered_users')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const saveRegisteredUsers = (users: Array<{ username: string; password: string }>): void => {
    try {
      localStorage.setItem('vmr_registered_users', JSON.stringify(users))
    } catch {
      // ignore
    }
  }

  const handleLogin = (values: { username: string; password: string }) => {
    setLoading(true)
    setTimeout(() => {
      if (!values.username || !values.password) {
        message.error('请输入用户名和密码')
        setLoading(false)
        return
      }

      const users = getRegisteredUsers()
      const matchedUser = users.find(
        u => u.username === values.username && u.password === values.password
      )

      if (matchedUser || (users.length === 0 && values.username === 'admin' && values.password === '123456')) {
        localStorage.setItem('user', JSON.stringify({ name: values.username }))
        onLogin({ name: values.username })
        message.success('登录成功')
      } else {
        message.error('用户名或密码错误')
      }
      setLoading(false)
    }, 500)
  }

  const handleRegister = (values: { username: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    if (values.password.length < 6) {
      message.error('密码长度不能少于6位')
      return
    }

    const users = getRegisteredUsers()
    if (users.find(u => u.username === values.username)) {
      message.error('用户名已存在')
      return
    }

    setLoading(true)
    setTimeout(() => {
      users.push({ username: values.username, password: values.password })
      saveRegisteredUsers(users)
      localStorage.setItem('user', JSON.stringify({ name: values.username }))
      onLogin({ name: values.username })
      message.success('注册并登录成功')
      setLoading(false)
    }, 500)
  }

  const handleWechatLogin = () => {
    message.info('微信扫码功能需要后端支持，请联系管理员配置')
  }

  const handleForgotPassword = () => {
    setForgotModalOpen(true)
    setForgotStep('input')
    setResetUsername('')
    setResetPassword('')
  }

  const handleFindPassword = () => {
    const users = getRegisteredUsers()
    const user = users.find(u => u.username === resetUsername)

    if (!user) {
      message.error('未找到该用户名，请确认输入是否正确')
      return
    }

    // 进入设置新密码步骤
    setForgotStep('setPassword')
  }

  const handleSetNewPassword = () => {
    if (!newPassword) {
      message.error('请输入新密码')
      return
    }

    if (newPassword.length < 6) {
      message.error('密码长度不能少于6位')
      return
    }

    if (newPassword !== confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    // 更新密码
    const users = getRegisteredUsers()
    const updatedUsers = users.map(u =>
      u.username === resetUsername ? { ...u, password: newPassword } : u
    )
    saveRegisteredUsers(updatedUsers)

    setResetPassword(newPassword)
    setForgotStep('success')
  }

  const tabItems = [
    {
      key: 'login',
      label: (
        <span>
          <UserOutlined />
          账号登录
        </span>
      ),
      children: (
        <Form
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{ username: 'admin', password: '123456' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="link" onClick={handleForgotPassword} style={{ padding: 0, height: 'auto' }}>
              <QuestionCircleOutlined /> 忘记密码？
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: (
        <span>
          <UserOutlined />
          注册账号
        </span>
      ),
      children: (
        <Form
          layout="vertical"
          onFinish={handleRegister}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请设置密码（至少6位）"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              注册并登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'wechat',
      label: (
        <span>
          <WechatOutlined />
          微信注册
        </span>
      ),
      children: (
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <QRCode
            value="https://open.weixin.qq.com/connect/oauth2/authorize"
            size={200}
            errorLevel="M"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            使用微信扫描二维码进行注册/登录
          </Text>
          <Button
            type="link"
            onClick={handleWechatLogin}
          >
            如何获取微信登录权限？
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px'
      }}>
        <Card
          style={{
            width: 420,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <Space direction="vertical" size={24} style={{ width: '100%', textAlign: 'center' }}>
            <div>
              <CarOutlined style={{ fontSize: 48, color: '#1677FF', marginBottom: 8 }} />
              <Title level={3} style={{ margin: 0, color: '#262626' }}>车辆保养维修记录</Title>
              <Text type="secondary">欢迎使用，请先登录或注册</Text>
            </div>

            <Tabs items={tabItems} centered />

            <Divider style={{ margin: '12px 0' }} />

            <Text type="secondary" style={{ fontSize: 12 }}>
              首次使用？点击「注册账号」或「微信注册」创建新账户
            </Text>
          </Space>
        </Card>
      </div>

      {/* 忘记密码模态框 */}
      <Modal
        title="找回密码"
        open={forgotModalOpen}
        onCancel={() => setForgotModalOpen(false)}
        footer={null}
        width={400}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {forgotStep === 'input' && (
            <>
              <Text>请输入您注册的用户名，系统将为您重置密码</Text>
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                size="large"
              />
              <Button type="primary" block size="large" onClick={handleFindPassword}>
                找回密码
              </Button>
            </>
          )}

          {forgotStep === 'setPassword' && (
            <>
              <Text>请为账号「{resetUsername}」设置新密码</Text>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入新密码（至少6位）"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                size="large"
              />
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                size="large"
              />
              <Button type="primary" block size="large" onClick={handleSetNewPassword}>
                确认修改
              </Button>
              <Button type="link" block onClick={() => setForgotStep('input')}>
                返回上一步
              </Button>
            </>
          )}

          {forgotStep === 'success' && (
            <>
              <Alert
                message="密码修改成功"
                description={
                  <Space direction="vertical">
                    <Text>您的新密码已设置完成</Text>
                    <Text type="secondary">请使用新密码登录</Text>
                  </Space>
                }
                type="success"
                showIcon
              />
              <Button type="primary" block onClick={() => {
                setForgotModalOpen(false)
                setForgotStep('input')
                setNewPassword('')
                setConfirmPassword('')
              }}>
                知道了
              </Button>
            </>
          )}
        </Space>
      </Modal>
    </>
  )
}

export default LoginPage