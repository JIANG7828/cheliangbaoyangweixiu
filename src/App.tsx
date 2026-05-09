import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
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
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677FF',
          colorPrimaryHover: '#4096FF',
          colorPrimaryActive: '#0958D9',
          borderRadius: 8,
          fontSize: 14,
          colorText: '#1F1F1F',
          colorTextSecondary: '#595959',
          colorTextTertiary: '#8C8C8C',
          colorBgLayout: '#F0F2F5',
          colorBgContainer: '#FFFFFF',
          colorBorder: '#D9D9D9',
          colorTextHeading: '#262626',
          colorTextDescription: '#8C8C8C',
        },
        components: {
          Card: {
            headerBg: '#FAFAFA',
            boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
          },
          Button: {
            borderRadius: 6,
          },
          Input: {
            borderRadius: 6,
          },
          Table: {
            borderRadius: 8,
            borderRadiusLG: 8,
          },
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          borderBottom: '1px solid #e8e8e8',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          height: 64,
          lineHeight: '64px'
        }}>
          <div style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1677FF',
            marginRight: 48,
            letterSpacing: '1px'
          }}>
            车辆保养记录
          </div>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              flex: 1,
              borderBottom: 'none',
              fontSize: 15,
              fontWeight: 500
            }}
          />
        </Header>
        <Content style={{
          background: '#F0F2F5',
          padding: '24px 24px 48px',
          minHeight: 'calc(100vh - 64px)'
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
