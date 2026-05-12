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
  Tag,
  Modal,
  Upload,
  Image
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CameraOutlined,
  DollarOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Vehicle, MaintenanceRecord, MaintenanceProject } from '../types';
import { recognizeReceipt, generateSuggestions, imageToBase64, AIOCRResult, AIBehaviorSuggestion } from '../services/ai';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

interface PhotoRecordPageProps {
  currentVehicle: Vehicle;
  records: MaintenanceRecord[];
  onAddRecord: (record: MaintenanceRecord) => void;
}

const PhotoRecordPage: React.FC<PhotoRecordPageProps> = ({ currentVehicle, records, onAddRecord }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [projects, setProjects] = useState<MaintenanceProject[]>([]);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectCostInput, setProjectCostInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AIBehaviorSuggestion[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [receiptDesc, setReceiptDesc] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');

  const totalCost = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.cost || 0), 0),
    [projects]
  );

  const handleImageRecognize = async (file: File) => {
    setRecognizing(true);
    try {
      const base64 = await imageToBase64(file);
      setPreviewImage(base64);
      
      const result: AIOCRResult = await recognizeReceipt(base64, true);
      
      setProjects(result.projects);
      form.setFieldsValue({
        date: result.date ? dayjs(result.date) : dayjs(),
        location: result.location || '',
        mechanic: result.mechanic || ''
      });
      setPhotoUploaded(true);
      message.success(`AI 识别成功！识别到 ${result.projects.length} 个项目`);

      // 获取AI建议
      const suggestions = await generateSuggestions(
        { projects: result.projects.map(p => p.name) },
        records.filter(r => r.vehicleId === currentVehicle._id)
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '识别失败，请重试');
    } finally {
      setRecognizing(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    listType: 'picture-card',
    fileList,
    maxCount: 1,
    accept: 'image/*',
    customRequest: ({ file, onSuccess, onError }) => {
      handleImageRecognize(file as File)
        .then(() => onSuccess?.('ok'))
        .catch(err => onError?.(err));
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
    onRemove: () => {
      setFileList([]);
      setPhotoUploaded(false);
      setPreviewImage('');
    },
  };

  const handleTextRecognize = async () => {
    if (!receiptDesc.trim()) {
      message.warning('请输入单据描述');
      return;
    }
    setRecognizing(true);
    try {
      const result: AIOCRResult = await recognizeReceipt(receiptDesc, false);
      
      setProjects(result.projects);
      form.setFieldsValue({
        date: result.date ? dayjs(result.date) : dayjs(),
        location: result.location || '',
        mechanic: result.mechanic || ''
      });
      setPhotoUploaded(true);
      message.success(`AI 识别成功！识别到 ${result.projects.length} 个项目`);

      const suggestions = await generateSuggestions(
        { projects: result.projects.map(p => p.name) },
        records.filter(r => r.vehicleId === currentVehicle._id)
      );
      setAiSuggestions(suggestions);
      setShowManualInput(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '识别失败，请重试');
    } finally {
      setRecognizing(false);
    }
  };

  const addProject = () => {
    if (!projectNameInput) {
      message.warning('请输入项目名称');
      return;
    }
    const cost = parseFloat(projectCostInput) || 0;
    if (cost <= 0) {
      message.warning('请输入金额');
      return;
    }
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
          <Space direction="vertical" align="center" style={{ width: '100%', padding: '24px 0' }}>
            <CameraOutlined style={{ fontSize: 56, color: '#1677FF', marginBottom: 12 }} />
            <Title level={4} style={{ marginBottom: 4, color: '#262626' }}>AI 智能识别保养单据</Title>
            <Text type="secondary" style={{ marginBottom: 20 }}>拍照或上传单据，AI 自动提取关键信息</Text>
            
            <Space direction="vertical" size={16} style={{ width: '100%', maxWidth: 500 }}>
              {previewImage && (
                <div style={{ marginBottom: 12 }}>
                  <Image src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
                </div>
              )}
              <Upload.Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: '#1677FF', fontSize: 48 }} />
                </p>
                <p className="ant-upload-text">点击或拖拽上传保养单据图片</p>
                <p className="ant-upload-hint">支持 JPG、PNG 格式，AI 将自动识别内容</p>
              </Upload.Dragger>
              <Button
                type="link"
                onClick={() => setShowManualInput(true)}
                style={{ marginTop: -8 }}
              >
                或者手动描述单据内容
              </Button>
            </Space>
          </Space>
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              message="AI 识别成功"
              description="已自动提取单据信息，请核对并修改"
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
            />
            <Tag icon={<RobotOutlined />} color="processing">AI 识别完成</Tag>
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
                      placeholder="项目名称"
                      onPressEnter={addProject}
                    />
                  </Col>
                  <Col span={8}>
                    <Input
                      value={projectCostInput}
                      onChange={(e) => setProjectCostInput(e.target.value)}
                      placeholder="输入金额"
                      prefix="¥"
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
              <Form.Item label="AI 智能建议">
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

      <Modal
        title="描述保养单据内容"
        open={showManualInput}
        onCancel={() => setShowManualInput(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowManualInput(false)}>取消</Button>,
          <Button
            key="submit"
            type="primary"
            loading={recognizing}
            onClick={handleTextRecognize}
          >
            AI 识别
          </Button>
        ]}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            message="使用说明"
            description="请简单描述单据上的内容，AI 会自动提取项目、金额等信息。"
            type="info"
            showIcon
          />
          <Input.TextArea
            rows={4}
            value={receiptDesc}
            onChange={(e) => setReceiptDesc(e.target.value)}
            placeholder="例如：今天在丰田4S店保养，张师傅帮忙更换了机油350元，更换机滤80元，更换空滤60元"
          />
        </Space>
      </Modal>
    </Space>
  );
};

export default PhotoRecordPage;
