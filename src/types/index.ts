// 车辆类型
export interface Vehicle {
  _id: string;
  plateNumber: string;
  vehicleModel: string;
  vin?: string;
  purchaseDate?: string;
  // AI 分析用扩展字段
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  // 常规保养里程间隔（单位：公里）
  mileageInterval?: number;
  // 油箱容积（单位：升）
  fuelTankCapacity?: number;
}

// 保养项目类型
export interface MaintenanceProject {
  name: string;
  cost: number;
}

// 记录类型
export interface MaintenanceRecord {
  _id: string;
  vehicleId: string;
  date: string;
  location: string;
  projects: MaintenanceProject[];
  totalCost: number;
  mechanic?: string;
  recordType: '保养' | '维修' | '更换配件';
  imageUrl?: string;
}

// 提醒类型
export interface Reminder {
  _id: string;
  vehicleId: string;
  project: string;
  nextDate: string;
  nextMileage?: number;
  notified: boolean;
}

// 油耗记录类型
export interface FuelRecord {
  _id: string;
  vehicleId: string;
  date: string; // 加油日期
  mileage: number; // 当前里程（公里）
  fuelAmount: number; // 加油量（升）
  price: number; // 单价（元/升）
  totalCost: number; // 总金额
  fullTank: boolean; // 是否加满
  location?: string; // 加油站
  notes?: string; // 备注
}

// 油价数据
export interface OilPriceData {
  province: string;
  city?: string;
  district?: string;
  date: string;
  prices: {
    type: string; // 油品类型：92#、95#、98#、0#
    price: number; // 单价
    unit: string; // 单位：元/升
  }[];
  source: string; // 数据来源
  updatedAt: string; // 更新时间
}

// 保养周期节点追踪
export interface MileageCheckpoint {
  mileage: number;      // 里程节点（如 5000, 10000）
  completed: boolean;   // 是否已完成保养
  date?: string;        // 完成日期
  projects?: string[];  // 已做的项目
  notes?: string;       // 备注
}

// AI保养计划
export interface AIPlan {
  project: string;
  desc: string;
  nextDate: string;
  daysUntil: number;
  status: 'urgent' | 'upcoming' | 'planned';
  confidence: '高' | '中' | '低';
}

// 常用项目列表
export const COMMON_PROJECTS = [
  '更换机油', '更换机滤', '更换空滤', '更换空调滤芯', '更换燃油滤芯',
  '更换刹车油', '更换变速箱油', '更换冷却液', '更换火花塞',
  '更换刹车片', '更换轮胎', '轮胎换位', '轮胎动平衡', '四轮定位',
  '更换电瓶', '更换雨刮器', '常规保养', '大保养', '小保养'
];
