import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Space,
  Typography,
  Tag,
  Modal,
  message,
  Row,
  Col,
  Timeline,
  Collapse,
  Alert,
  Statistic,
  List,
  Badge
} from 'antd';
import {
  PlusOutlined,
  BellOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { Reminder, AIPlan, Vehicle } from '../types';

const { Text } = Typography;

interface ReminderPageProps {
  reminders: Reminder[];
  aiPlan: AIPlan[];
  currentVehicle: Vehicle;
  onAddReminder: (reminder: Reminder) => void;
  onAddAIPlan: (reminders: Reminder[]) => void;
}

const ReminderPage: React.FC<ReminderPageProps> = ({
  reminders,
  aiPlan,
  currentVehicle,
  onAddReminder,
  onAddAIPlan
}) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const vehicleReminders = reminders.filter(r => r.vehicleId === currentVehicle._id);
  const urgentCount = aiPlan.filter(p => p.status === 'urgent').length;
  const upcomingCount = aiPlan.filter(p => p.status === 'upcoming').length;
  const plannedCount = aiPlan.filter(p => p.status === 'planned').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'error';
      case 'upcoming': return 'warning';
      case 'planned': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'urgent': return '紧急';
      case 'upcoming': return '即将到期';
      case 'planned': return '计划中';
      default: return status;
    }
  };

  const handleAddReminder = (values: any) => {
    const reminder: Reminder = {
      _id: Date.now().toString(),
      vehicleId: currentVehicle._id,
      project: values.project,
      nextDate: values.nextDate.format('YYYY-MM-DD'),
      nextMileage: values.nextMileage || undefined,
      notified: false
    };
    onAddReminder(reminder);
    message.success('添加成功');
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleAddAIPlan = () => {
    const newReminders: Reminder[] = aiPlan.map(p => ({
      _id: Date.now().toString() + Math.random(),
      vehicleId: currentVehicle._id,
      project: p.project,
      nextDate: p.nextDate,
      nextMileage: undefined,
      notified: false
    }));
    onAddAIPlan(newReminders);
    message.success(`已添加 ${aiPlan.length} 条AI保养计划到提醒`);
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <RobotOutlined style={{ color: '#1677FF' }} />
            <Text strong style={{ color: '#262626' }}>AI保养计划</Text>
          </Space>
        }
        extra={
          <Button onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '展开' : '收起'}
          </Button>
        }
      >
        <Collapse
          activeKey={collapsed ? [] : ['1']}
          onChange={(keys) => setCollapsed(keys.length === 0)}
          items={[{
            key: '1',
            label: '',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Alert
                  message="智能保养建议"
                  description="根据您的车辆使用情况和历史记录，AI分析出以下即将到期的保养项目，建议您按计划执行以保持车辆最佳状态。"
                  type="info"
                  showIcon
                />

                <Row gutter={16}>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="紧急"
                        value={urgentCount}
                        valueStyle={{ color: '#FF4D4F' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="即将到期"
                        value={upcomingCount}
                        valueStyle={{ color: '#D48806' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card>
                      <Statistic
                        title="计划中"
                        value={plannedCount}
                        valueStyle={{ color: '#52C41A' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Timeline>
                  {aiPlan.map((plan, index) => (
                    <Timeline.Item
                      key={index}
                      color={plan.status === 'urgent' ? 'red' : plan.status === 'upcoming' ? 'orange' : 'green'}
                    >
                      <Space direction="vertical" size={4}>
                        <Space>
                          <Text strong style={{ color: '#262626' }}>{plan.project}</Text>
                          <Tag color={getStatusColor(plan.status)}>
                            {getStatusText(plan.status)}
                          </Tag>
                        </Space>
                        <Text style={{ color: '#595959' }}>{plan.desc}</Text>
                        <Space>
                          <CalendarOutlined style={{ color: '#8C8C8C' }} />
                          <Text style={{ color: '#595959' }}>
                            {plan.nextDate} | {plan.daysUntil}天后
                          </Text>
                        </Space>
                        <Text style={{ fontSize: 12, color: '#8C8C8C' }}>
                          置信度: {plan.confidence}
                        </Text>
                      </Space>
                    </Timeline.Item>
                  ))}
                </Timeline>

                <Button type="primary" onClick={handleAddAIPlan} block>
                  一键添加到提醒
                </Button>
              </Space>
            )
          }]}
        />
      </Card>

      <Card
        title={
          <Space>
            <BellOutlined style={{ color: '#D48806' }} />
            <Text strong style={{ color: '#262626' }}>保养提醒</Text>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            添加提醒
          </Button>
        }
      >
        {vehicleReminders.length > 0 ? (
          <List
            dataSource={vehicleReminders}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    item.notified ? (
                      <CheckCircleOutlined style={{ fontSize: 24, color: '#52C41A' }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ fontSize: 24, color: '#D48806' }} />
                    )
                  }
                  title={
                    <Space>
                      <Text strong style={{ color: '#262626' }}>{item.project}</Text>
                      <Badge
                        status={item.notified ? 'success' : 'warning'}
                        text={item.notified ? '已提醒' : '待提醒'}
                      />
                    </Space>
                  }
                  description={
                    <Space>
                      <CalendarOutlined style={{ color: '#8C8C8C' }} />
                      <Text style={{ color: '#595959' }}>
                        下次保养：{item.nextDate}
                        {item.nextMileage && ` | 里程：${item.nextMileage}公里`}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px 0' }}>
            <BellOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Text type="secondary">暂无保养提醒</Text>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              添加第一条提醒
            </Button>
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
  );
};

export default ReminderPage;
