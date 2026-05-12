import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, Avatar, Space, Dropdown } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  CarOutlined,
  FileTextOutlined,
  CameraOutlined,
  HistoryOutlined,
  BellOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import HomePage from './pages/Home';
import ManualRecordPage from './pages/ManualRecord';
import PhotoRecordPage from './pages/PhotoRecord';
import HistoryPage from './pages/History';
import ReminderPage from './pages/Reminder';
import VehiclePage from './pages/Vehicle';
import RecordDetailPage from './pages/RecordDetail';
import LoginPage from './pages/Login';
import { Vehicle, MaintenanceRecord, Reminder as ReminderType, AIPlan } from './types';
import { initialVehicles, initialRecords } from './data/mock';
import { generateMaintenancePlan } from './services/ai';

const { Header, Content } = Layout;

const STORAGE_KEYS = {
  user: 'user',
  vehicles: 'vmr_vehicles',
  records: 'vmr_records',
  reminders: 'vmr_reminders',
  currentVehicleId: 'vmr_currentVehicleId',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

interface UserInfo {
  name: string;
}

const AppLayout: React.FC<{ user: UserInfo; onLogout: () => void }> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Clear stale reminders from localStorage (old 2024 dates)
  const storedReminders = loadFromStorage<ReminderType[]>(STORAGE_KEYS.reminders, []);
  const today = new Date();
  const validReminders = storedReminders.filter(r => {
    const reminderDate = new Date(r.nextDate);
    return reminderDate >= today;
  });
  if (validReminders.length !== storedReminders.length) {
    saveToStorage(STORAGE_KEYS.reminders, validReminders);
  }

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadFromStorage(STORAGE_KEYS.vehicles, initialVehicles));
  const [records, setRecords] = useState<MaintenanceRecord[]>(() => loadFromStorage(STORAGE_KEYS.records, initialRecords));
  const [reminders, setReminders] = useState<ReminderType[]>(validReminders);
  const [aiPlans, setAiPlans] = useState<AIPlan[]>([]);
  const currentVehicleIdRef = useRef<string>(loadFromStorage(STORAGE_KEYS.currentVehicleId, initialVehicles[0]._id));

  const currentVehicleId = currentVehicleIdRef.current;
  const currentVehicle = vehicles.find(v => v._id === currentVehicleId) || vehicles[0] || initialVehicles[0];

  // 在记录更新时自动重新生成AI保养计划并推送到首页
  const prevRecordsCount = useRef(0);
  const isGenerating = useRef(false);

  useEffect(() => {
    // 首次加载或记录数量变化时自动重新生成
    if (isGenerating.current) return;
    if (records.length === prevRecordsCount.current && prevRecordsCount.current > 0) return;

    isGenerating.current = true;
    prevRecordsCount.current = records.length;

    const autoGenerate = async () => {
      try {
        const plans = await generateMaintenancePlan(
          {
            mileage: currentVehicle.mileage || 50000,
            brand: currentVehicle.brand || '丰田',
            model: currentVehicle.model || '卡罗拉',
            year: currentVehicle.year || 2020,
          },
          records.filter(r => r.vehicleId === currentVehicle._id)
        );

        setAiPlans(plans);

        const today = new Date();
        const sixMonthsFromNow = new Date(today);
        sixMonthsFromNow.setMonth(today.getMonth() + 6);

        const halfYearReminders: ReminderType[] = plans
          .filter(p => {
            const reminderDate = new Date(p.nextDate);
            return reminderDate <= sixMonthsFromNow;
          })
          .map(p => ({
            _id: Date.now().toString() + Math.random(),
            vehicleId: currentVehicle._id,
            project: p.project,
            nextDate: p.nextDate,
            nextMileage: undefined,
            notified: false,
          }));

        if (halfYearReminders.length > 0) {
          setReminders(halfYearReminders);
          saveToStorage(STORAGE_KEYS.reminders, halfYearReminders);
        }
      } catch (error) {
        console.error('AI生成失败:', error);
      } finally {
        setTimeout(() => { isGenerating.current = false; }, 1000);
      }
    };

    autoGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, currentVehicle._id, currentVehicle.brand, currentVehicle.mileage, currentVehicle.model, currentVehicle.year]);

  // Persist vehicles
  const setVehiclesAndSave = (updater: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => {
    setVehicles(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveToStorage(STORAGE_KEYS.vehicles, next);
      return next;
    });
  };

  // Persist records
  const setRecordsAndSave = (updater: MaintenanceRecord[] | ((prev: MaintenanceRecord[]) => MaintenanceRecord[])) => {
    setRecords(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveToStorage(STORAGE_KEYS.records, next);
      return next;
    });
  };

  // Persist reminders
  const setRemindersAndSave = (updater: ReminderType[] | ((prev: ReminderType[]) => ReminderType[])) => {
    setReminders(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveToStorage(STORAGE_KEYS.reminders, next);
      return next;
    });
  };

  // Persist current vehicle
  const setCurrentVehicleAndSave = (vehicle: Vehicle) => {
    currentVehicleIdRef.current = vehicle._id;
    saveToStorage(STORAGE_KEYS.currentVehicleId, vehicle._id);
    // Force re-render by updating state
    setVehicles(prev => [...prev]);
  };

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/manual', icon: <FileTextOutlined />, label: '手动记录' },
    { key: '/photo', icon: <CameraOutlined />, label: '拍照记录' },
    { key: '/history', icon: <HistoryOutlined />, label: '履历查询' },
    { key: '/reminder', icon: <BellOutlined />, label: '保养提醒' },
    { key: '/vehicle', icon: <CarOutlined />, label: '车辆管理' }
  ];

  const handleDeleteRecord = (recordId: string) => {
    setRecordsAndSave(prev => prev.filter(r => r._id !== recordId));
  };

  const handleUpdateRecord = (updatedRecord: MaintenanceRecord) => {
    setRecordsAndSave(prev => prev.map(r => r._id === updatedRecord._id ? updatedRecord : r));
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehiclesAndSave(prev => {
      const next = prev.map(v => v._id === updatedVehicle._id ? updatedVehicle : v);
      return next;
    });
    if (currentVehicleId === updatedVehicle._id) {
      setCurrentVehicleAndSave(updatedVehicle);
    }
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setVehiclesAndSave(prev => {
      const filtered = prev.filter(v => v._id !== vehicleId);
      if (currentVehicleId === vehicleId && filtered.length > 0) {
        currentVehicleIdRef.current = filtered[0]._id;
        saveToStorage(STORAGE_KEYS.currentVehicleId, filtered[0]._id);
        setVehicles([...filtered]); // force re-render
      }
      return filtered;
    });
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: onLogout,
    },
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
          colorBgLayout: '#EBF5FB',
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
          Button: { borderRadius: 6 },
          Input: { borderRadius: 6 },
          Table: { borderRadius: 8, borderRadiusLG: 8 },
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
            letterSpacing: '1px',
            cursor: 'pointer'
          }} onClick={() => navigate('/')}>
            车辆保养记录
          </div>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={
              location.pathname === '/record-detail'
                ? ['/history']
                : [location.pathname]
            }
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              flex: 1,
              borderBottom: 'none',
              fontSize: 15,
              fontWeight: 500
            }}
          />
          <Space style={{ marginLeft: 24 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: '#262626' }}>{user.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{
          background: '#EBF5FB',
          padding: '24px 24px 48px',
          minHeight: 'calc(100vh - 64px)'
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<HomePage
                currentVehicle={currentVehicle}
                vehicles={vehicles}
                records={records}
                reminders={reminders}
                onVehicleChange={setCurrentVehicleAndSave}
                onAddReminder={(reminder) => setRemindersAndSave(prev => [...prev, reminder])}
              />} />
              <Route path="/manual" element={<ManualRecordPage
                currentVehicle={currentVehicle}
                records={records}
                onAddRecord={(record) => setRecordsAndSave(prev => [record, ...prev])}
              />} />
              <Route path="/photo" element={<PhotoRecordPage
                currentVehicle={currentVehicle}
                records={records}
                onAddRecord={(record) => setRecordsAndSave(prev => [record, ...prev])}
              />} />
              <Route path="/history" element={<HistoryPage
                records={records}
                currentVehicle={currentVehicle}
                onDeleteRecord={handleDeleteRecord}
              />} />
              <Route path="/record-detail" element={<RecordDetailPage
                records={records}
                vehicles={vehicles}
                onUpdateRecord={handleUpdateRecord}
                onDeleteRecord={handleDeleteRecord}
              />} />
              <Route path="/reminder" element={<ReminderPage
                currentVehicle={currentVehicle}
                records={records}
                aiPlans={aiPlans}
                onAddReminder={(reminder) => setRemindersAndSave(prev => [...prev, reminder])}
              />} />
              <Route path="/vehicle" element={<VehiclePage
                vehicles={vehicles}
                currentVehicle={currentVehicle}
                onAddVehicle={(v) => setVehiclesAndSave(prev => [...prev, v])}
                onUpdateVehicle={handleUpdateVehicle}
                onDeleteVehicle={handleDeleteVehicle}
                onSelectVehicle={setCurrentVehicleAndSave}
              />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.user);
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (newUser: UserInfo) => {
    saveToStorage(STORAGE_KEYS.user, newUser);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.user);
    setUser(null);
  };

  return (
    <Router>
      {user ? (
        <AppLayout user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </Router>
  );
};

export default App;
