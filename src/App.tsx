import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, theme } from 'antd';
import {
  CarOutlined,
  FileTextOutlined,
  CameraOutlined,
  HistoryOutlined,
  BellOutlined,
  HomeOutlined
} from '@ant-design/icons';
import HomePage from './pages/Home';
import ManualRecordPage from './pages/ManualRecord';
import PhotoRecordPage from './pages/PhotoRecord';
import HistoryPage from './pages/History';
import ReminderPage from './pages/Reminder';
import VehiclePage from './pages/Vehicle';
import { Vehicle, MaintenanceRecord, Reminder as ReminderType, AIPlan } from './types';
import { initialVehicles, initialRecords, initialReminders, initialAIPlan } from './data/mock';

const { Header, Content } = Layout;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [records, setRecords] = useState<MaintenanceRecord[]>(initialRecords);
  const [reminders, setReminders] = useState<ReminderType[]>(initialReminders);
  const [aiPlan] = useState<AIPlan[]>(initialAIPlan);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle>(initialVehicles[0]);

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/manual', icon: <FileTextOutlined />, label: '手动记录' },
    { key: '/photo', icon: <CameraOutlined />, label: '拍照记录' },
    { key: '/history', icon: <HistoryOutlined />, label: '履历查询' },
    { key: '/reminder', icon: <BellOutlined />, label: '保养提醒' },
    { key: '/vehicle', icon: <CarOutlined />, label: '车辆管理' }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677FF',
          borderRadius: 8,
          fontSize: 14,
          colorText: '#333333',
          colorTextSecondary: '#666666',
          colorTextTertiary: '#999999',
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1677FF',
            marginRight: 48
          }}>
            车辆保养记录
          </div>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, borderBottom: 'none' }}
          />
        </Header>
        <Content style={{
          background: '#F5F7FA',
          padding: 24
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<HomePage
                currentVehicle={currentVehicle}
                vehicles={vehicles}
                records={records}
                onVehicleChange={setCurrentVehicle}
              />} />
              <Route path="/manual" element={<ManualRecordPage
                currentVehicle={currentVehicle}
                records={records}
                onAddRecord={(record) => setRecords([record, ...records])}
              />} />
              <Route path="/photo" element={<PhotoRecordPage
                currentVehicle={currentVehicle}
                records={records}
                onAddRecord={(record) => setRecords([record, ...records])}
              />} />
              <Route path="/history" element={<HistoryPage
                records={records}
                currentVehicle={currentVehicle}
              />} />
              <Route path="/reminder" element={<ReminderPage
                reminders={reminders}
                aiPlan={aiPlan}
                currentVehicle={currentVehicle}
                onAddReminder={(reminder) => setReminders([...reminders, reminder])}
                onAddAIPlan={(newReminders) => setReminders([...reminders, ...newReminders])}
              />} />
              <Route path="/vehicle" element={<VehiclePage
                vehicles={vehicles}
                currentVehicle={currentVehicle}
                onAddVehicle={(v) => setVehicles([...vehicles, v])}
                onSelectVehicle={setCurrentVehicle}
              />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

const App: React.FC = () => (
  <Router>
    <AppLayout />
  </Router>
);

export default App;
