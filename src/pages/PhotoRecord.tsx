import React, { useState, useMemo } from 'react';
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
  Alert,
  Tag
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CameraOutlined,
  DollarOutlined,
  RobotOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Vehicle, MaintenanceRecord, MaintenanceProject } from '../types';

const { Title, Text } = Typography;

interface PhotoRecordPageProps {
  currentVehicle: Vehicle;
  records: MaintenanceRecord[];
  onAddRecord: (record: MaintenanceRecord) => void;
}

const PhotoRecordPage: React.FC<PhotoRecordPageProps> = ({ currentVehicle, onAddRecord }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [projects, setProjects] = useState<MaintenanceProject[]>([]);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectCostInput, setProjectCostInput] = useState('');
  const [aiSuggestions] = useState([
    { text: '根据单据内容，建议同时检查刹车油状态', type: 'info' },
    { text: '上次更换空滤已超过8000公里，建议检查', type: 'warning' }
  ]);

  const totalCost = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.cost || 0), 0),
    [projects]
  );

  const simulatePhotoUpload = () => {
    setRecognizing(true);
    setTimeout(() => {
      setRecognizing(false);
      setPhotoUploaded(true);
      form.setFieldsValue({
        date: new Date(),
        location: '丰田4S店',
        mechanic: '张师傅'
      });
      setProjects([
        { name: '更换机油', cost: 350 },
        { name: '更换机滤', cost: 80 }
      ]);
      message.success('AI识别成功！请确认信息');
    }, 2000);
  };

  const addProject = () => {
    if (!projectNameInput) return;
    const cost = parseFloat(projectCostInput) || 0;
    setProjects([...projects, { name: projectNameInput, cost }]);
    setProjectNameInput('');
    setProjectCostInput('');
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const onFinish = (values: any) => {
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
      recordType: '保养'
    };

    onAddRecord(record);
    message.success('保存成功');
    setTimeout(() => navigate('/'), 1000);
  };

  if (!currentVehicle) {
    return <Card><Text type="secondary">请先添加车辆</Text></Card>;
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card>
        {!photoUploaded ? (
          <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px 0' }}>
            <CameraOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} style={{ marginBottom: 8, color: '#262626' }}>点击模拟拍照</Title>
            <Text type="secondary" style={{ marginBottom: 24 }}>支持保养/维修单据照片</Text>
            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={simulatePhotoUpload}
              loading={recognizing}
              size="large"
            >
              {recognizing ? 'AI识别中...' : '模拟拍照'}
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              message="AI识别成功"
              description="已自动识别单据信息，您可以修改以下内容"
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
            />
            <Tag icon={<RobotOutlined />} color="blue">AI识别 92%</Tag>
          </Space>
        )}
      </Card>

      {photoUploaded && (
        <Card title="识别结果（可修改）">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="date" label="时间">
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="location" label="地点">
                  <Input placeholder="识别的门店名称" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="项目">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {projects.length > 0 && (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {projects.map((project, index) => (
                      <Row key={index} align="middle" style={{
                        padding: '12px 16px',
                        background: '#fafafa',
                        borderRadius: 6
                      }}>
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

                <Row gutter={8}>
                  <Col span={10}>
                    <Input
                      value={projectNameInput}
                      onChange={(e) => setProjectNameInput(e.target.value)}
                      placeholder="手动添加项目"
                    />
                  </Col>
                  <Col span={8}>
                    <Input
                      value={projectCostInput}
                      onChange={(e) => setProjectCostInput(e.target.value)}
                      placeholder="金额"
                      prefix="¥"
                    />
                  </Col>
                  <Col span={6}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={addProject}
                      disabled={!projectNameInput}
                      block
                    >
                      添加
                    </Button>
                  </Col>
                </Row>
              </Space>
            </Form.Item>

            <Form.Item label="总金额">
              <Card size="small" style={{ background: '#fafafa', borderRadius: 6 }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text style={{ color: '#595959' }}>共 {projects.length} 个项目</Text>
                  </Col>
                  <Col>
                    <Title level={4} style={{ margin: 0, color: '#1677FF', fontWeight: 'bold' }}>
                      ¥{totalCost.toFixed(2)}
                    </Title>
                  </Col>
                </Row>
              </Card>
            </Form.Item>

            <Form.Item name="mechanic" label="维修人员（可选）">
              <Input placeholder="识别的维修人员" />
            </Form.Item>

            {aiSuggestions.length > 0 && (
              <Form.Item label="AI建议">
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {aiSuggestions.map((suggestion, index) => (
                    <Alert
                      key={index}
                      message={suggestion.text}
                      type={suggestion.type === 'warning' ? 'warning' : 'info'}
                      showIcon
                    />
                  ))}
                </Space>
              </Form.Item>
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                保存记录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </Space>
  );
};

export default PhotoRecordPage;
