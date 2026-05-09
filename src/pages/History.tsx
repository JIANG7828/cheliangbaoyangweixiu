import React, { useMemo, useState } from 'react';
import {
  Card,
  Table,
  Space,
  Typography,
  Tag,
  Select,
  Button,
  Statistic,
  Row,
  Col,
  Popconfirm
} from 'antd';
import {
  DeleteOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { MaintenanceRecord } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface HistoryPageProps {
  records: MaintenanceRecord[];
  currentVehicle: { _id: string };
}

const HistoryPage: React.FC<HistoryPageProps> = ({ records, currentVehicle }) => {
  const [timeFilter, setTimeFilter] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');

  const vehicleRecords = useMemo(() => {
    let filtered = records.filter(r => r.vehicleId === currentVehicle._id);

    if (timeFilter > 0) {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - timeFilter, now.getDate());
      filtered = filtered.filter(r => new Date(r.date) >= startDate);
    }

    if (typeFilter) {
      filtered = filtered.filter(r => r.recordType === typeFilter);
    }

    return filtered;
  }, [records, currentVehicle, timeFilter, typeFilter]);

  const totalCost = useMemo(() =>
    vehicleRecords.reduce((sum, r) => sum + r.totalCost, 0),
    [vehicleRecords]
  );

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case '保养': return 'success';
      case '维修': return 'warning';
      case '更换配件': return 'processing';
      default: return 'default';
    }
  };

  const columns: ColumnsType<MaintenanceRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (text: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#8C8C8C' }} />
          <Text style={{ color: '#262626' }}>{text}</Text>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'recordType',
      key: 'recordType',
      width: 100,
      filters: [
        { text: '保养', value: '保养' },
        { text: '维修', value: '维修' },
        { text: '更换配件', value: '更换配件' }
      ],
      onFilter: (value, record) => record.recordType === value,
      render: (type: string) => (
        <Tag color={getRecordTypeColor(type)}>{type}</Tag>
      )
    },
    {
      title: '项目',
      dataIndex: 'projects',
      key: 'projects',
      ellipsis: true,
      render: (projects: { name: string }[]) => (
        <Text style={{ color: '#262626' }}>{projects.map(p => p.name).join('、')}</Text>
      )
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (text: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#8C8C8C' }} />
          <Text type="secondary">{text}</Text>
        </Space>
      )
    },
    {
      title: '费用',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      sorter: (a, b) => a.totalCost - b.totalCost,
      render: (cost: number) => (
        <Text strong style={{ color: '#1677FF', fontSize: 15 }}>
          ¥{cost.toFixed(2)}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Popconfirm title="确定删除？" onConfirm={() => {}}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="记录数量"
              value={vehicleRecords.length}
              suffix="条"
              valueStyle={{ color: '#262626' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="累计费用"
              value={totalCost}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1677FF' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均费用"
              value={vehicleRecords.length > 0 ? totalCost / vehicleRecords.length : 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#D48806' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space>
          <FilterOutlined style={{ color: '#595959' }} />
          <Text strong style={{ color: '#262626' }}>筛选：</Text>
          <Select
            style={{ width: 150 }}
            value={timeFilter}
            onChange={setTimeFilter}
            options={[
              { value: 0, label: '全部时间' },
              { value: 1, label: '近1个月' },
              { value: 3, label: '近3个月' },
              { value: 12, label: '近1年' }
            ]}
          />
          <Select
            style={{ width: 150 }}
            value={typeFilter || undefined}
            onChange={setTypeFilter}
            allowClear
            placeholder="记录类型"
            options={[
              { value: '保养', label: '保养' },
              { value: '维修', label: '维修' },
              { value: '更换配件', label: '更换配件' }
            ]}
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={vehicleRecords}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </Space>
  );
};

export default HistoryPage;
