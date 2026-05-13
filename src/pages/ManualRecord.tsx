import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  AutoComplete,
  Select,
  Space,
  Typography,
  message,
  Row,
  Col,
  Modal,
  InputNumber,
  Spin,
  Alert
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  DashboardOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Vehicle, MaintenanceRecord, MaintenanceProject } from '../types';
import { COMMON_PROJECTS } from '../types';
import { generateSuggestions } from '../services/ai';

const { Title, Text } = Typography;

interface ManualRecordPageProps {
  currentVehicle: Vehicle;
  records: MaintenanceRecord[];
  onAddRecord: (record: MaintenanceRecord) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
}

interface AISuggestion {
  text: string;
  type: 'info' | 'warning' | 'success';
}

const ManualRecordPage: React.FC<ManualRecordPageProps> = ({
  currentVehicle,
  onAddRecord,
  onUpdateVehicle,
  records
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [projects, setProjects] = useState<MaintenanceProject[]>([]);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectCostInput, setProjectCostInput] = useState('');
  const [mileageModalVisible, setMileageModalVisible] = useState(false);
  const [mileageForm] = Form.useForm();
  const [pendingRecord, setPendingRecord] = useState<MaintenanceRecord | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const totalCost = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.cost || 0), 0),
    [projects]
  );

  // 调用 AI 生成保养建议
  const callAIForSuggestions = useCallback(async (record: MaintenanceRecord, currentRecords: MaintenanceRecord[]) => {
    setAiLoading(true);
    try {
      const suggestions = await generateSuggestions(
        { projects: record.projects.map(p => p.name) },
        currentRecords.map(r => ({ projects: r.projects, date: r.date }))
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI 建议生成失败:', error);
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const handleMileageConfirm = useCallback(() => {
    mileageForm.validateFields().then(values => {
      if (!pendingRecord) return;

      // 更新车辆里程
      const updatedVehicle: Vehicle = {
        ...currentVehicle,
        mileage: values.mileage
      };
      onUpdateVehicle(updatedVehicle);

      // 保存本次记录
      onAddRecord(pendingRecord);

      message.success('保存成功');
      setMileageModalVisible(false);
      setTimeout(() => navigate('/'), 1000);
    });
  }, [mileageForm, pendingRecord, currentVehicle, onUpdateVehicle, onAddRecord, navigate]);

  const handleMileageCancel = useCallback(() => {
    if (!pendingRecord) return;

    // 不更新里程，只保存记录
    onAddRecord(pendingRecord);
    message.success('保存成功');
    setMileageModalVisible(false);
    setTimeout(() => navigate('/'), 1000);
  }, [pendingRecord, onAddRecord, navigate]);

  const projectOptions: string[] = COMMON_PROJECTS;

  const addProject = useCallback(() => {
    if (!projectNameInput) {
      message.warning('请输入项目名称');
      return;
    }
    const cost = parseFloat(projectCostInput) || 0;
    if (cost <= 0) {
      message.warning('请输入金额');
      return;
    }
    setProjects(prev => [...prev, { name: projectNameInput, cost }]);
    setProjectNameInput('');
    setProjectCostInput('');
  }, [projectNameInput, projectCostInput]);

  const removeProject = useCallback((index: number) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  }, []);

  const onFinish = useCallback((values: any) => {
    if (projects.length === 0) {
      message.warning('请至少添加一个项目');
      return;
    }

    const record: MaintenanceRecord = {
      _id: Date.now().toString(),
      vehicleId: currentVehicle._id,
      date: values.date.format('YYYY-MM-DD HH:mm'),
      location: values.location || '',
      projects,
      totalCost,
      mechanic: values.mechanic || '',
      recordType: values.recordType || '保养'
    };

    setPendingRecord(record);
    mileageForm.setFieldsValue({
      mileage: currentVehicle.mileage || undefined
    });
    setAiSuggestions([]);
    setMileageModalVisible(true);

    // 调用 AI 生成建议
    callAIForSuggestions(record, records);
  }, [projects, totalCost, currentVehicle, mileageForm, callAIForSuggestions, records]);

  if (!currentVehicle) {
    return (
      <Card>
        <Text type="secondary">请先添加车辆</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card title="手动记录">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            date: dayjs(),
            recordType: '保养'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="发生时间"
                rules={[{ required: true, message: '请选择时间' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="地点">
                <Input prefix={<EnvironmentOutlined />} placeholder="输入门店名称" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="项目" required>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {projects.length > 0 && (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {projects.map((project, index) => (
                    <Row key={index} align="middle" style={{
                      padding: '14px 16px',
                      background: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #f0f0f0'
                    }}>
                      <Col span={2}>
                        <Text style={{ color: '#8C8C8C' }}>{index + 1}.</Text>
                      </Col>
                      <Col span={10}>
                        <Text strong style={{ color: '#262626', fontSize: 15 }}>{project.name}</Text>
                      </Col>
                      <Col span={6}>
                        <Space>
                          <DollarOutlined style={{ color: '#595959', fontSize: 13 }} />
                          <Text style={{ color: '#1677FF', fontWeight: 'bold', fontSize: 15 }}>
                            ¥{project.cost.toFixed(2)}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeProject(index)}
                        />
                      </Col>
                    </Row>
                  ))}
                </Space>
              )}

              <Row gutter={12}>
                <Col span={10}>
                  <AutoComplete
                  value={projectNameInput}
                  onChange={setProjectNameInput}
                  onSelect={setProjectNameInput}
                  options={projectOptions.map(p => ({ value: p }))}
                  placeholder="输入项目名称"
                  style={{ width: '100%' }}
                  allowClear
                />
                </Col>
                <Col span={8}>
                  <Input
                    value={projectCostInput}
                    onChange={(e) => setProjectCostInput(e.target.value)}
                    placeholder="输入金额"
                    prefix="¥"
                    style={{ width: '100%' }}
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
                    style={{ height: 40 }}
                  >
                    添加
                  </Button>
                </Col>
              </Row>
            </Space>
          </Form.Item>

          {projects.length > 0 && (
            <Form.Item label="总金额">
              <Card size="small" style={{ background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text style={{ color: '#595959', fontSize: 14 }}>共 {projects.length} 个项目</Text>
                  </Col>
                  <Col>
                    <Title level={4} style={{ margin: 0, color: '#1677FF', fontWeight: 'bold' }}>
                      ¥{totalCost.toFixed(2)}
                    </Title>
                  </Col>
                </Row>
              </Card>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="mechanic" label="维修人员（可选）">
                <Input placeholder="输入维修人员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="recordType" label="记录类型">
                <Select>
                  <Select.Option value="保养">保养</Select.Option>
                  <Select.Option value="维修">维修</Select.Option>
                  <Select.Option value="更换配件">更换配件</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" style={{ height: 48, fontSize: 16 }}>
              保存记录
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 里程更新对话框 */}
      <Modal
        title={<Space><DashboardOutlined />完善车辆信息</Space>}
        open={mileageModalVisible}
        closable={false}
        footer={[
          <Button key="skip" onClick={handleMileageCancel}>稍后完善</Button>,
          <Button key="confirm" type="primary" onClick={handleMileageConfirm}>确认保存</Button>
        ]}
        width={400}
      >
        <Form form={mileageForm} layout="vertical">
          <Form.Item
            name="mileage"
            label="当前里程"
            rules={[{ required: true, message: '请输入当前里程' }]}
            extra="输入当前总行驶里程，帮助AI更准确预测保养周期"
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={100}
              placeholder="请输入里程数"
              addonAfter="公里"
            />
          </Form.Item>
        </Form>

        {/* AI 保养建议区域 */}
        <div style={{ marginTop: 24 }}>
          <Space style={{ marginBottom: 12 }}>
            <RobotOutlined style={{ color: '#1677FF' }} />
            <Text strong>AI 保养建议</Text>
          </Space>

          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin tip="AI 分析中..." />
            </div>
          ) : aiSuggestions.length > 0 ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {aiSuggestions.map((suggestion, index) => (
                <Alert
                  key={index}
                  message={suggestion.text}
                  type={suggestion.type === 'warning' ? 'warning' : suggestion.type === 'success' ? 'success' : 'info'}
                  showIcon
                  style={{ borderRadius: 6 }}
                />
              ))}
            </Space>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              根据您的保养记录，AI 将给出个性化建议
            </Text>
          )}
        </div>
      </Modal>
    </Space>
  );
};

export default ManualRecordPage;
