import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  Image,
  Spin,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CameraOutlined,
  DollarOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
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
  onUpdateVehicle: (vehicle: Vehicle) => void;
}

interface AISuggestion {
  text: string;
  type: 'info' | 'warning' | 'success';
}

const PhotoRecordPage: React.FC<PhotoRecordPageProps> = ({
  currentVehicle,
  records,
  onAddRecord,
  onUpdateVehicle
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [projects, setProjects] = useState<MaintenanceProject[]>([]);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectCostInput, setProjectCostInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [receiptDesc, setReceiptDesc] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');

  // 里程对话框
  const [mileageModalVisible, setMileageModalVisible] = useState(false);
  const [mileageForm] = Form.useForm();
  const [pendingRecord, setPendingRecord] = useState<MaintenanceRecord | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCost = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.cost || 0), 0),
    [projects]
  );

  const handleImageRecognize = useCallback(async (file: File) => {
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
  }, [records, currentVehicle._id]);

  // 拍照处理
  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleCameraFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageRecognize(file);
    }
    // 清空 input 以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageRecognize]);

  const uploadProps: UploadProps = {
    name: 'file',
    listType: 'picture-card',
    fileList,
    maxCount: 1,
    accept: 'image/*',
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await handleImageRecognize(file as File);
        // 等待识别完成后再通知 Upload 组件成功
        onSuccess?.('ok');
      } catch (err) {
        onError?.(err as Error);
      }
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

  // 调用 AI 生成建议
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
      recordType: '保养'
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
              {/* 隐藏的文件输入框用于拍照 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraFileChange}
                style={{ display: 'none' }}
              />

              {previewImage && (
                <div style={{ marginBottom: 12 }}>
                  <Image src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
                </div>
              )}

              {/* 拍照按钮 */}
              <Button
                type="primary"
                icon={<CameraOutlined />}
                onClick={handleCameraCapture}
                size="large"
                style={{ height: 64, fontSize: 16 }}
                block
                loading={recognizing}
              >
                拍照识别
              </Button>

              <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>或</Text>

              {/* 上传区域 */}
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
                <Form.Item name="date" label="发生时间">
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

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                保存记录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

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
