import { Vehicle, MaintenanceRecord, Reminder, AIPlan } from '../types';

// 初始车辆数据
export const initialVehicles: Vehicle[] = [
  { _id: '1', plateNumber: '京A·88888', vehicleModel: '丰田凯美瑞 2020款', vin: 'LHG12345678901234', purchaseDate: '2020-05-15', fuelTankCapacity: 60, mileageInterval: 10000 },
  { _id: '2', plateNumber: '京B·66666', vehicleModel: '本田雅阁 2019款', fuelTankCapacity: 56, mileageInterval: 5000 }
];

// 初始记录数据
export const initialRecords: MaintenanceRecord[] = [
  {
    _id: '1',
    vehicleId: '1',
    date: '2024-03-15 10:30',
    location: '丰田4S店',
    projects: [{ name: '更换机油', cost: 350 }, { name: '更换机滤', cost: 80 }, { name: '更换空滤', cost: 150 }],
    totalCost: 580,
    mechanic: '张师傅',
    recordType: '保养'
  },
  {
    _id: '2',
    vehicleId: '1',
    date: '2024-01-20 14:15',
    location: '快修店',
    projects: [{ name: '更换刹车片', cost: 800 }, { name: '轮胎换位', cost: 400 }],
    totalCost: 1200,
    mechanic: '李师傅',
    recordType: '维修'
  },
  {
    _id: '3',
    vehicleId: '1',
    date: '2023-12-05 09:00',
    location: '米其林轮胎店',
    projects: [{ name: '更换轮胎×4', cost: 3200 }, { name: '四轮定位', cost: 400 }],
    totalCost: 3600,
    mechanic: '王师傅',
    recordType: '更换配件'
  }
];

// 初始提醒数据
export const initialReminders: Reminder[] = [
  { _id: '1', vehicleId: '1', project: '更换机油', nextDate: '2024-06-15', nextMileage: 15000, notified: false },
  { _id: '2', vehicleId: '1', project: '更换刹车油', nextDate: '2024-04-01', notified: true }
];

// AI保养计划
export const initialAIPlan: AIPlan[] = [
  { project: '更换机油', desc: '全合成机油每1万公里或6个月', nextDate: '2024-09-15', daysUntil: 180, status: 'planned', confidence: '高' },
  { project: '更换刹车油', desc: '每4万公里或2年', nextDate: '2024-06-20', daysUntil: 88, status: 'upcoming', confidence: '中' },
  { project: '更换空滤', desc: '每2万公里或1年', nextDate: '2024-04-20', daysUntil: 27, status: 'urgent', confidence: '高' }
];
