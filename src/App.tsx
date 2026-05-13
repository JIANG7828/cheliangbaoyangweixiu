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
  RobotOutlined,
  UserOutlined,
  LogoutOutlined,
  DropboxOutlined,
  GoldOutlined
} from '@ant-design/icons';
import HomePage from './pages/Home';
import CarAssistantPage from './pages/CarAssistant';
import ManualRecordPage from './pages/ManualRecord';
import PhotoRecordPage from './pages/PhotoRecord';
import HistoryPage from './pages/History';
import ReminderPage from './pages/Reminder';
import VehiclePage from './pages/Vehicle';
import RecordDetailPage from './pages/RecordDetail';
import LoginPage from './pages/Login';
import FuelRecordPage from './pages/FuelRecord';
import OilPricePage from './pages/OilPrice';
import { Vehicle, MaintenanceRecord, Reminder as ReminderType, AIPlan, FuelRecord, MileageCheckpoint } from './types';
import { initialVehicles, initialRecords } from './data/mock';
import { generateMaintenancePlan } from './services/ai';

const { Header, Content } = Layout;

// ==================== 存储工具 ====================

const GLOBAL_KEYS = {
  user: 'vmr_user',
  registeredUsers: 'vmr_registered_users',
  // 老全局 key（用于数据迁移）
  oldVehicles: 'vmr_vehicles',
  oldRecords: 'vmr_records',
  oldReminders: 'vmr_reminders',
  oldCurrentVehicleId: 'vmr_currentVehicleId',
  oldFuelRecords: 'vmr_fuel_records',
  oldCheckpoints: 'vmr_checkpoints',
};

// 用户隔离：每个用户独立存储空间
const mkKey = (userName: string, suffix: string) => `vmr_${userName}_${suffix}`;

const loadRaw = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const saveRaw = (key: string, data: unknown): void => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
};
const loadOr = <T,>(key: string, fallback: T): T => {
  const s = loadRaw(key);
  if (s === null) return fallback;
  try {
    const parsed = JSON.parse(s);
    // 防止双序列化（parsed 应与 fallback 类型一致，否则回退）
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    if (!Array.isArray(fallback) && typeof fallback === 'object' && (parsed === null || typeof parsed !== 'object')) return fallback;
    return parsed as T;
  } catch { return fallback; }
};

// 首次登录：把老全局数据迁移到当前用户前缀下
const migrateIfNeeded = (userName: string): void => {
  const migratedFlag = loadRaw(mkKey(userName, '_migrated'));

  // 判断是否需要迁移：从未迁移过，或已迁移但数据是字符串（双序列化坏数据）需要重新迁移
  const needsMigration = migratedFlag === null ||
    (() => {
      const vRaw = loadRaw(mkKey(userName, 'vehicles'));
      // 如果 vehicles 存的是字符串而非数组，说明是双序列化坏数据
      return typeof vRaw === 'string' && !vRaw.startsWith('[');
    })();

  if (!needsMigration) return;

  // 迁移车辆（先 parse，再通过 saveRaw.stringify 存储，避免二次序列化）
  const oldVeh = loadRaw(GLOBAL_KEYS.oldVehicles);
  try {
    saveRaw(mkKey(userName, 'vehicles'), oldVeh ? JSON.parse(oldVeh) : initialVehicles);
  } catch { saveRaw(mkKey(userName, 'vehicles'), initialVehicles); }

  // 迁移记录
  const oldRec = loadRaw(GLOBAL_KEYS.oldRecords);
  try {
    saveRaw(mkKey(userName, 'records'), oldRec ? JSON.parse(oldRec) : initialRecords);
  } catch { saveRaw(mkKey(userName, 'records'), initialRecords); }

  // 迁移当前车辆ID（字符串，直接存）
  const oldVid = loadRaw(GLOBAL_KEYS.oldCurrentVehicleId);
  if (oldVid !== null) saveRaw(mkKey(userName, 'currentVehicleId'), oldVid);

  // 迁移油耗记录
  const oldFuel = loadRaw(GLOBAL_KEYS.oldFuelRecords);
  try { saveRaw(mkKey(userName, 'fuel_records'), oldFuel ? JSON.parse(oldFuel) : []); }
  catch { saveRaw(mkKey(userName, 'fuel_records'), []); }

  // 迁移保养节点
  const oldCp = loadRaw(GLOBAL_KEYS.oldCheckpoints);
  try { saveRaw(mkKey(userName, 'checkpoints'), oldCp ? JSON.parse(oldCp) : {}); }
  catch { saveRaw(mkKey(userName, 'checkpoints'), {}); }

  // 标记迁移完成
  saveRaw(mkKey(userName, '_migrated'), true);
};

// ==================== AppLayout ====================

interface UserInfo { name: string }

const AppLayout: React.FC<{ user: UserInfo; onLogout: () => void }> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { name: userName } = user;

  // 首次加载：数据迁移（一次性）
  useEffect(() => {
    migrateIfNeeded(userName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 派生用户专属存储 key
  const k = (suffix: string) => mkKey(userName, suffix);

  // 状态初始化（读取当前用户的专属存储，并填充缺失字段的默认值）
  const [vehicles, setVehicles] = useState<Vehicle[]>(
    () => {
      const loaded = loadOr<Vehicle[]>(k('vehicles'), initialVehicles);
      return loaded.map(v => ({
        ...v,
        mileageInterval: v.mileageInterval || 10000,
        fuelTankCapacity: v.fuelTankCapacity || 50,
      }));
    }
  );
  const [records, setRecords] = useState<MaintenanceRecord[]>(
    () => loadOr(k('records'), initialRecords)
  );
  const [reminders, setReminders] = useState<ReminderType[]>(() => {
    const raw = loadOr<ReminderType[]>(k('reminders'), []);
    const today = new Date();
    return raw.filter(r => new Date(r.nextDate) >= today);
  });
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(
    () => loadOr(k('fuel_records'), [])
  );
  const [checkpoints, setCheckpoints] = useState<Record<string, MileageCheckpoint[]>>(
    () => loadOr(k('checkpoints'), {})
  );

  const [aiPlans, setAiPlans] = useState<AIPlan[]>([]);
  const currentVehicleIdRef = useRef<string>(
    loadOr(k('currentVehicleId'), vehicles[0]?._id ?? initialVehicles[0]._id)
  );

  const currentVehicleId = currentVehicleIdRef.current;
  const currentVehicle = vehicles.find(v => v._id === currentVehicleId) || vehicles[0] || initialVehicles[0];

  // 持久化 helpers
  const setVehiclesAndSave = (updater: Vehicle[] | ((p: Vehicle[]) => Vehicle[])) => {
    setVehicles(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRaw(k('vehicles'), next);
      return next;
    });
  };

  const setRecordsAndSave = (updater: MaintenanceRecord[] | ((p: MaintenanceRecord[]) => MaintenanceRecord[])) => {
    setRecords(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRaw(k('records'), next);
      return next;
    });
  };

  const setRemindersAndSave = (updater: ReminderType[] | ((p: ReminderType[]) => ReminderType[])) => {
    setReminders(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRaw(k('reminders'), next);
      return next;
    });
  };

  const setFuelRecordsAndSave = (updater: FuelRecord[] | ((p: FuelRecord[]) => FuelRecord[])) => {
    setFuelRecords(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRaw(k('fuel_records'), next);
      return next;
    });
  };

  const setCheckpointsAndSave = (updater: Record<string, MileageCheckpoint[]> | ((p: Record<string, MileageCheckpoint[]>) => Record<string, MileageCheckpoint[]>)) => {
    setCheckpoints(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRaw(k('checkpoints'), next);
      return next;
    });
  };

  const setCurrentVehicleAndSave = (vehicle: Vehicle) => {
    currentVehicleIdRef.current = vehicle._id;
    saveRaw(k('currentVehicleId'), vehicle._id);
    setVehicles(prev => [...prev]);
  };

  // 自动生成 AI 保养计划
  const prevRecordsCount = useRef(0);
  const isGenerating = useRef(false);

  useEffect(() => {
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
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        const halfYearReminders: ReminderType[] = plans
          .filter(p => new Date(p.nextDate) <= sixMonthsFromNow)
          .map(p => ({
            _id: Date.now().toString() + Math.random(),
            vehicleId: currentVehicle._id,
            project: p.project,
            nextDate: p.nextDate,
            nextMileage: undefined,
            notified: false,
          }));
        if (halfYearReminders.length > 0) {
          setRemindersAndSave(halfYearReminders);
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

  const handleDeleteRecord = (recordId: string) =>
    setRecordsAndSave(prev => prev.filter(r => r._id !== recordId));

  const handleUpdateRecord = (updatedRecord: MaintenanceRecord) =>
    setRecordsAndSave(prev => prev.map(r => r._id === updatedRecord._id ? updatedRecord : r));

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehiclesAndSave(prev => prev.map(v => v._id === updatedVehicle._id ? updatedVehicle : v));
    if (currentVehicleId === updatedVehicle._id) {
      setCurrentVehicleAndSave(updatedVehicle);
    }
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setVehiclesAndSave(prev => {
      const filtered = prev.filter(v => v._id !== vehicleId);
      if (currentVehicleId === vehicleId && filtered.length > 0) {
        currentVehicleIdRef.current = filtered[0]._id;
        saveRaw(k('currentVehicleId'), filtered[0]._id);
      }
      return filtered;
    });
  };

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout },
  ];

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/assistant', icon: <RobotOutlined />, label: '养车助理' },
    { key: '/fuel', icon: <DropboxOutlined />, label: '油耗记录' },
    { key: '/oilprice', icon: <GoldOutlined />, label: '油价查询' },
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
            fontSize: 20, fontWeight: 'bold', color: '#1677FF',
            marginRight: 48, letterSpacing: '1px', cursor: 'pointer'
          }} onClick={() => navigate('/')}>
            车辆保养记录
          </div>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={
              location.pathname === '/record-detail' ? ['/history'] : [location.pathname]
            }
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ flex: 1, borderBottom: 'none', fontSize: 15, fontWeight: 500 }}
          />
          <Space style={{ marginLeft: 24 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ color: '#262626' }}>{userName}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ background: '#EBF5FB', padding: '24px 24px 48px', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Routes>
              <Route path="/" element={<HomePage
                currentVehicle={currentVehicle}
                vehicles={vehicles}
                records={records}
                reminders={reminders}
                fuelRecords={fuelRecords}
                checkpoints={checkpoints[currentVehicle._id] || []}
                onVehicleChange={setCurrentVehicleAndSave}
                onAddReminder={(r) => setRemindersAndSave(prev => [...prev, r])}
                onFuelRecordsChange={setFuelRecordsAndSave}
                onCheckpointsChange={(cp) => setCheckpointsAndSave(prev => ({ ...prev, [currentVehicle._id]: cp }))}
              />} />
              <Route path="/manual" element={<ManualRecordPage
                currentVehicle={currentVehicle}
                records={records}
                onAddRecord={(r) => setRecordsAndSave(prev => [r, ...prev])}
                onUpdateVehicle={(v) => setVehiclesAndSave(prev => prev.map(x => x._id === v._id ? v : x))}
              />} />
              <Route path="/photo" element={<PhotoRecordPage
                currentVehicle={currentVehicle}
                records={records}
                onAddRecord={(r) => setRecordsAndSave(prev => [r, ...prev])}
                onUpdateVehicle={(v) => setVehiclesAndSave(prev => prev.map(x => x._id === v._id ? v : x))}
              />} />
              <Route path="/history" element={<HistoryPage
                records={records}
                currentVehicle={currentVehicle}
                onDeleteRecord={handleDeleteRecord}
              />} />
              <Route path="/assistant" element={<CarAssistantPage
                currentVehicle={currentVehicle}
                records={records}
                fuelRecords={fuelRecords}
                checkpoints={checkpoints[currentVehicle._id] || []}
              />} />
              <Route path="/fuel" element={<FuelRecordPage
                currentVehicle={currentVehicle}
                fuelRecords={fuelRecords}
                onFuelRecordsChange={setFuelRecordsAndSave}
              />} />
              <Route path="/oilprice" element={<OilPricePage />} />
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
                onAddReminder={(r) => setRemindersAndSave(prev => [...prev, r])}
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

// ==================== App 入口 ====================

const App: React.FC = () => {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const s = loadRaw(GLOBAL_KEYS.user);
    return s ? (() => { try { return JSON.parse(s) as UserInfo; } catch { return null; } })() : null;
  });

  const handleLogin = (newUser: UserInfo) => {
    saveRaw(GLOBAL_KEYS.user, newUser);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(GLOBAL_KEYS.user);
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
