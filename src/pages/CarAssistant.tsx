import React, { useState, useRef, useEffect } from 'react';
import {
  Card, Input, Button, Space, Avatar, Spin, Typography
} from 'antd';
import {
  RobotOutlined, UserOutlined, SendOutlined
} from '@ant-design/icons';
import { Vehicle, MaintenanceRecord, FuelRecord, MileageCheckpoint } from '../types';

const { Text } = Typography;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CarAssistantPageProps {
  currentVehicle: Vehicle;
  records: MaintenanceRecord[];
  fuelRecords: FuelRecord[];      // 由 App.tsx 按账号隔离后传入
  checkpoints: MileageCheckpoint[]; // 由 App.tsx 按账号隔离后传入
}

// 品牌知识库类型
interface BrandInfo {
  oilSpec: string;
  oilBrand: string[];
  oilInterval: string;
  filterBrand: string[];
  tireSpec?: string;
  coolantSpec?: string;
  brakeFluid?: string;
  notes: string[];
}

// 品牌知识库 - 按品牌分类的详细保养规格
const BRAND_KNOWLEDGE: Record<string, BrandInfo> = {
  '丰田': {
    oilSpec: '0W-20 / 5W-30（涡轮车型建议0W-20）',
    oilBrand: ['丰田原厂', '美孚1号', '壳牌极净超凡', '嘉实多极护'],
    oilInterval: '10000公里或1年',
    filterBrand: ['丰田原厂', '马勒', '曼牌'],
    notes: ['TNGA架构车型普遍使用0W-20低粘度机油', '混动车型注意变速箱油规格', '定期检查发动机舱易损件'],
  },
  '本田': {
    oilSpec: '0W-20 / 5W-30（地球梦发动机建议0W-20）',
    oilBrand: ['本田原厂', '美孚', '壳牌', '道达尔'],
    oilInterval: '5000-10000公里（视机油类型）',
    filterBrand: ['本田原厂', 'AC德科', '博世'],
    notes: ['地球梦发动机对机油敏感，建议原厂规格', 'CVT变速箱注意保养周期', '涡轮车型注意机油品质'],
  },
  '大众': {
    oilSpec: '5W-30 / 0W-30（涡轮车型必须全合成）',
    oilBrand: ['大众原厂', '美孚1号', '壳牌超凡', '嘉实多极护', '力魔'],
    oilInterval: '10000公里或1年',
    filterBrand: ['大众原厂', '马勒', '曼牌', '博世'],
    tireSpec: '根据配置型号，原厂推荐韩泰、倍耐力、米其林',
    coolantSpec: 'G13/G12++防冻液（蓝色/紫色）',
    brakeFluid: 'DOT4标准刹车油',
    notes: ['涡轮车型必须使用全合成机油', 'EA211/EA888发动机注意机油消耗', '保养后记得复位保养提示'],
  },
  '宝马': {
    oilSpec: '0W-30 / 0W-40（LL-01认证）',
    oilBrand: ['宝马原厂', '美孚1号', '壳牌超越', '嘉实多爱尔铃', '力魔'],
    oilInterval: '12000-15000公里或1年',
    filterBrand: ['宝马原厂', '曼牌', '马勒'],
    tireSpec: '原厂推荐防爆胎，品牌包括倍耐力，米其林、韩泰',
    coolantSpec: 'BMW原厂防冻液',
    brakeFluid: 'DOT4 Plus',
    notes: ['Longlife-01认证机油', 'B48/B58发动机对机油敏感', '建议使用原厂诊断系统复位'],
  },
  '奔驰': {
    oilSpec: '0W-40 / 5W-40（MB 229.5认证）',
    oilBrand: ['奔驰原厂', '美孚1号', '壳牌', '嘉实多', '力魔'],
    oilInterval: '12000-15000公里',
    filterBrand: ['奔驰原厂', '曼牌', '马勒'],
    tireSpec: '原厂推荐防爆胎：倍耐力、马牌、米其林',
    coolantSpec: 'MB原厂防冻液（蓝色）',
    brakeFluid: 'DOT4',
    notes: ['MB 229.5/229.3认证机油', '注意发动机型号对应的机油规格', 'AMG车型使用专用机油'],
  },
  '日产': {
    oilSpec: '0W-20 / 5W-30（VC-Turbo建议0W-20）',
    oilBrand: ['日产原厂', '美孚', '壳牌', '嘉实多'],
    oilInterval: '5000-10000公里',
    filterBrand: ['日产原厂', '马勒', '博世'],
    notes: ['VQ/QR发动机使用0W-20效果更佳', 'CVT车型注意变速箱油规格', '涡轮车型注意机油标号'],
  },
  '马自达': {
    oilSpec: '0W-20（创驰蓝天建议）',
    oilBrand: ['马自达原厂', '美孚1号', '壳牌', '出光'],
    oilInterval: '10000公里',
    filterBrand: ['马自达原厂', '马勒'],
    notes: ['创驰蓝天发动机专用0W-20', '自然吸气车型可使用5W-30', 'GVC矢量控制系统注意保养'],
  },
  '通用': {
    oilSpec: '0W-20 / 5W-30（dexos1认证）',
    oilBrand: ['ACDelco', '美孚', '壳牌', '胜牌'],
    oilInterval: '7500-10000公里',
    filterBrand: ['ACDelco', 'AC德科', '博世'],
    tireSpec: '原厂推荐固特异、普利司通、米其林',
    coolantSpec: 'DEX-COOL防冻液',
    notes: ['涡轮车型必须使用全合成+dexos1认证', '6AT/9AT变速箱注意油品规格', '美系车注意机油消耗问题'],
  },
  '福特': {
    oilSpec: '0W-20 / 5W-30（WSS-M2C认证）',
    oilBrand: ['福特原厂', '美孚', '壳牌', '胜牌'],
    oilInterval: '10000公里',
    filterBrand: ['福特原厂', '马勒', '曼牌'],
    tireSpec: '原厂推荐固特异、米其林、倍耐力',
    coolantSpec: '福特原厂防冻液',
    notes: ['Ecoboost涡轮必须全合成', 'PowerShift双离合注意变速箱油', '注意DOT3/DOT4刹车油区分'],
  },
  '比亚迪': {
    oilSpec: '0W-20 / 5W-30（新能源车型注意混动专用）',
    oilBrand: ['比亚迪原厂', '美孚', '壳牌', '嘉实多'],
    oilInterval: '10000公里',
    filterBrand: ['比亚迪原厂', '博世', '马勒'],
    notes: ['DM-i混动车型注意发动机保养周期', 'EV车型无需机油保养', '定期检查三电系统'],
  },
  '特斯拉': {
    oilSpec: '无需机油（纯电动车）',
    oilBrand: ['不适用'],
    oilInterval: '不适用',
    filterBrand: ['不适用'],
    notes: ['纯电动车无需更换机油机滤', '定期检查刹车油（每2年）', '空调滤芯每2年更换', '轮胎换位每10000公里'],
  },
};

// 通用保养知识
interface KnowledgeItem {
  keywords: string[];
  getAnswer: (brand: string, brandInfo?: BrandInfo) => string;
}

const GENERAL_KNOWLEDGE: Record<string, KnowledgeItem> = {
  '机油': {
    keywords: ['机油', '换油', '发动机油'],
    getAnswer: (brand, info) => {
      if (!info) return '建议使用全合成机油，具体规格请参考车辆说明书。';
      return `${brand}推荐机油规格：${info.oilSpec}\n推荐品牌：${info.oilBrand.join('、')}\n更换周期：${info.oilInterval}`;
    },
  },
  '机滤': {
    keywords: ['机滤', '机油滤', '机油滤芯'],
    getAnswer: (brand, info) => {
      if (!info) return '建议使用品牌机油滤清器。';
      return `${brand}推荐机滤品牌：${info.filterBrand.join('、')}\n建议每次保养同时更换机油和机滤`;
    },
  },
  '空滤': {
    keywords: ['空滤', '空气滤', '空气滤芯'],
    getAnswer: () => '空气滤芯建议：\n- 更换周期：20000公里或2年\n- 品牌推荐：马勒、曼牌、博世、原厂\n- 经常在尘土环境行驶建议提前更换',
  },
  '空调滤': {
    keywords: ['空调滤', '空调滤芯'],
    getAnswer: () => '空调滤芯建议：\n- 更换周期：10000-20000公里或1年\n- 品牌推荐：马勒、曼牌、博世、3M\n- 建议入夏前更换，保证制冷效果\n- 含有活性炭的滤芯可更好过滤PM2.5',
  },
  '轮胎': {
    keywords: ['轮胎', '换胎'],
    getAnswer: (brand, info) => {
      const tireNote = info?.tireSpec ? `\n${brand}原厂推荐：${info.tireSpec}` : '';
      return `轮胎保养建议：\n- 更换周期：5-6万公里或5年（以先到为准）\n- 换位周期：每10000公里\n- 胎压检查：每月一次\n- 磨损警戒线：胎面低于1.6mm必须更换\n- 品牌推荐：米其林、倍耐力、马牌、固特异${tireNote}`;
    },
  },
  '刹车片': {
    keywords: ['刹车片', '刹车皮'],
    getAnswer: () => '刹车片保养建议：\n- 更换周期：前片30000-50000公里，后片50000-70000公里\n- 检查周期：每次保养时检查\n- 更换标准：厚度小于3mm\n- 品牌推荐：博世、TRW、布雷博、菲罗多、原厂',
  },
  '刹车油': {
    keywords: ['刹车油', '制动液'],
    getAnswer: (brand, info) => {
      const spec = info?.brakeFluid || 'DOT4';
      return `刹车油保养建议：\n- 更换周期：2年或40000公里\n- 规格标准：${spec}\n- 吸水后沸点降低，影响刹车性能\n- 品牌推荐：博世、TRW、统一、原厂`;
    },
  },
  '防冻液': {
    keywords: ['防冻液', '冷却液'],
    getAnswer: (brand, info) => {
      const spec = info?.coolantSpec || '原厂指定规格';
      return `防冻液保养建议：\n- 更换周期：2-4年（长效型可更长）\n- 规格：${spec}\n- 液位检查：每月检查，冷车时在MIN-MAX之间\n- 品牌推荐：原厂、百适通、车仆`;
    },
  },
  '火花塞': {
    keywords: ['火花塞', '点火'],
    getAnswer: () => '火花塞保养建议：\n- 更换周期：普通镍合金20000-30000公里，铂金60000-80000公里，铱金80000-100000公里\n- 品牌推荐：NGK、博世、电装、原厂\n- 更换时注意扭矩力矩',
  },
  '变速箱油': {
    keywords: ['变速箱油', '波箱油'],
    getAnswer: () => '变速箱油保养建议：\n- 自动变速箱：60000-80000公里\n- 手动变速箱：60000公里\n- CVT变速箱：50000-60000公里\n- 品牌推荐：原厂、爱信、采埃孚、加德士',
  },
  '电瓶': {
    keywords: ['电瓶', '电池', '蓄电池'],
    getAnswer: () => '电瓶保养建议：\n- 更换周期：3-5年\n- 检查周期：每半年检查\n- 亏电征兆：启动无力、大灯变暗、遥控不灵敏\n- 品牌推荐：瓦尔塔、博世、风帆、骆驼、统一',
  },
  '雨刮': {
    keywords: ['雨刮', '雨刷'],
    getAnswer: () => '雨刮保养建议：\n- 更换周期：1-2年\n- 更换信号：刮不干净、跳动、异响\n- 品牌推荐：博世、法雷奥、3M、米其林',
  },
  '节气门': {
    keywords: ['节气门', '怠速'],
    getAnswer: () => '节气门保养建议：\n- 清洗周期：20000-40000公里\n- 清洗信号：怠速抖动、加速无力、油耗增加\n- 清洗后需要复位节气门设定',
  },
  '积碳': {
    keywords: ['积碳', '碳沉积'],
    getAnswer: () => '积碳预防与清理：\n- 预防方法：避免长期短途行驶，定期高速行驶，使用合适标号汽油\n- 清理周期：30000-50000公里\n- 缸内直喷车型建议定期使用燃油添加剂',
  },
};

// 品牌关键词映射
const BRAND_KEYWORDS: Record<string, string[]> = {
  '丰田': ['丰田', 'TOYOTA', '卡罗拉', '凯美瑞', 'RAV4', '汉兰达', '雷凌', '亚洲龙', '皇冠', '埃尔法'],
  '本田': ['本田', 'HONDA', '雅阁', '思域', 'CRV', '冠道', '飞度', '皓影', 'URV'],
  '大众': ['大众', 'VW', '帕萨特', '迈腾', '途观', '朗逸', '宝来', '速腾', '高尔夫', '探岳'],
  '宝马': ['宝马', 'BMW', '华晨宝马'],
  '奔驰': ['奔驰', 'BENZ'],
  '奥迪': ['奥迪', 'AUDI', '一汽奥迪'],
  '日产': ['日产', 'NISSAN', '逍客', '奇骏', '天籁', '轩逸', '骐达'],
  '马自达': ['马自达', 'MAZDA', '阿特兹', '昂克赛拉', 'CX5', 'CX4'],
  '通用': ['通用', 'GM', '别克', 'BUICK', '雪佛兰', '凯迪拉克', '迈锐宝', '君威', '君越'],
  '福特': ['福特', 'FORD', '福克斯', '蒙迪欧', '锐界', '探险者', '金牛座'],
  '比亚迪': ['比亚迪', 'BYD', '秦', '汉', '唐', '宋', '元', '海豹', '海豚'],
  '特斯拉': ['特斯拉', 'TESLA', 'Model 3', 'Model Y', 'Model S', 'Model X'],
};

// 从用户问题中识别品牌
const detectBrand = (question: string): string | null => {
  const lowerQuestion = question.toLowerCase();
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some(kw => lowerQuestion.includes(kw.toLowerCase()))) {
      return brand;
    }
  }
  return null;
};

// 从车辆信息获取品牌
const getVehicleBrand = (vehicle: Vehicle): string | null => {
  if (vehicle.brand) return vehicle.brand;
  if (vehicle.vehicleModel) {
    const model = vehicle.vehicleModel.toLowerCase();
    for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
      if (keywords.some(kw => model.includes(kw.toLowerCase()))) {
        return brand;
      }
    }
  }
  return null;
};

const CarAssistantPage: React.FC<CarAssistantPageProps> = ({ currentVehicle, records, fuelRecords, checkpoints }) => {
  // 油耗记录（由 App.tsx 按账号隔离传入，已过滤到当前车辆）
  const vehicleFuelRecords = React.useMemo(
    () => fuelRecords.filter(r => r.vehicleId === currentVehicle?._id),
    [fuelRecords, currentVehicle?._id]
  );

  // 计算油耗统计数据
  const fuelStats = React.useMemo(() => {
    if (vehicleFuelRecords.length < 2) return null;
    const sorted = [...vehicleFuelRecords].sort((a, b) => a.mileage - b.mileage);
    let totalFuel = 0;
    let totalMileage = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalFuel += sorted[i].fuelAmount;
      totalMileage += sorted[i].mileage - sorted[i - 1].mileage;
    }
    return {
      avgConsumption: totalMileage > 0 ? (totalFuel / totalMileage * 100) : 0,
      recordCount: vehicleFuelRecords.length,
      totalFuel,
      totalMileage
    };
  }, [vehicleFuelRecords]);

  // 保养节点（由 App.tsx 按账号隔离传入）
  const vehicleCheckpoints = React.useMemo(() => checkpoints, [checkpoints]);

  const checkpointSummary = React.useMemo(() => {
    if (vehicleCheckpoints.length === 0) return null;
    const completed = vehicleCheckpoints.filter(cp => cp.completed);
    const next = vehicleCheckpoints.find(cp => !cp.completed);
    return {
      total: vehicleCheckpoints.length,
      completed: completed.length,
      nextMileage: next?.mileage,
      completedPoints: completed.map(cp => `${cp.mileage}km`).join('、')
    };
  }, [vehicleCheckpoints]);

  // AI保养提醒分析
  const maintenanceReminder = React.useMemo(() => {
    if (!currentVehicle?.mileage || vehicleCheckpoints.length === 0) return null;

    const currentMileage = currentVehicle.mileage;
    const completed = vehicleCheckpoints.filter(cp => cp.completed);
    const uncompleted = vehicleCheckpoints.filter(cp => !cp.completed);

    // 找到最近的未完成保养节点
    const nextMaintenance = uncompleted.find(cp => cp.mileage > currentMileage);
    const lastCompleted = completed[completed.length - 1];

    // 如果当前里程超过了下次保养里程
    if (nextMaintenance && currentMileage >= nextMaintenance.mileage) {
      return {
        type: 'overdue',
        message: `⚠️ 保养提醒：您的车辆当前里程 ${currentMileage.toLocaleString()} km，已超过设定的保养节点 ${nextMaintenance.mileage.toLocaleString()} km，建议尽快进行保养！`
      };
    }

    // 如果当前里程超过了最近一次完成保养的里程（但没有设置后续保养节点）
    if (completed.length > 0 && uncompleted.length === 0) {
      const interval = currentVehicle.mileageInterval || 10000;
      const expectedNext = lastCompleted.mileage + interval;
      if (currentMileage >= expectedNext) {
        return {
          type: 'reminder',
          message: `🔔 保养提醒：您的车辆上次保养为 ${lastCompleted.mileage.toLocaleString()} km，距今已行驶 ${(currentMileage - lastCompleted.mileage).toLocaleString()} km，建议进行下一次保养（预计 ${expectedNext.toLocaleString()} km）`
        };
      }
    }

    // 如果当前里程接近下次保养（剩余10%以内）
    if (nextMaintenance) {
      const diff = nextMaintenance.mileage - currentMileage;
      const interval = currentVehicle.mileageInterval || 10000;
      if (diff <= interval * 0.1 && diff > 0) {
        return {
          type: 'approaching',
          message: `⏰ 保养提示：距下次保养（${nextMaintenance.mileage.toLocaleString()} km）还有 ${diff.toLocaleString()} km，建议提前准备`
        };
      }
    }

    return null;
  }, [currentVehicle, vehicleCheckpoints]);

  // 整合欢迎消息（含保养提醒）
  const getWelcomeContent = () => {
    let content = `你好！我是你的养车助理

${currentVehicle?.brand || currentVehicle?.vehicleModel ? `当前车辆：${currentVehicle.brand || ''} ${currentVehicle.model || ''} ${currentVehicle.vehicleModel || ''}`.trim() : '请先添加车辆信息，我可以给出更精准的保养建议'}

${fuelStats ? `\n🚗 油耗数据已接入：共 ${fuelStats.recordCount} 条记录，平均油耗 ${fuelStats.avgConsumption.toFixed(2)} L/100km\n` : ''}${checkpointSummary ? `\n🔧 保养周期追踪：已完成 ${checkpointSummary.completed}/${checkpointSummary.total} 个节点${checkpointSummary.nextMileage ? `，下次保养 ${checkpointSummary.nextMileage.toLocaleString()} km` : ''}\n` : ''}`;

    if (maintenanceReminder) {
      content += `\n${maintenanceReminder.message}\n`;
    }

    content += `
你可以问我：
- 这车用什么机油？
- 轮胎多久换？
- XX品牌的保养规格？
- 我的油耗分析？
- 下次保养做什么？`;
    return content;
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: getWelcomeContent(),
      timestamp: Date.now(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 油耗关键词
  const FUEL_KEYWORDS = ['油耗', '耗油', '加油', '油费', '百公里', '油耗分析'];

  // 询问油耗分析
  const getFuelAnalysis = (): string => {
    if (vehicleFuelRecords.length < 2) {
      return `📊 油耗分析需要至少2条加油记录

当前记录：${vehicleFuelRecords.length} 条

请先到「油耗记录」页面记录几次加油信息，我会为您分析车辆油耗状况。`;
    }

    const sorted = [...vehicleFuelRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentRecords = sorted.slice(-10); // 最近10条

    // 计算每次加油的油耗
    const consumptions = [];
    for (let i = 1; i < recentRecords.length; i++) {
      const mileageDiff = recentRecords[i].mileage - recentRecords[i - 1].mileage;
      if (mileageDiff > 0) {
        const consumption = (recentRecords[i].fuelAmount / mileageDiff * 100);
        consumptions.push({
          date: recentRecords[i].date,
          consumption,
          mileageDiff,
          fuelAmount: recentRecords[i].fuelAmount
        });
      }
    }

    if (consumptions.length === 0) {
      return `📊 油耗数据异常：所有相邻记录的里程数均未递增（或里程差≤0）。
请检查加油记录中的里程是否按行驶顺序正确填写（后一次里程应大于前一次）。`;
    }

    const avgConsumption = consumptions.reduce((sum, c) => sum + c.consumption, 0) / consumptions.length;
    const maxConsumption = Math.max(...consumptions.map(c => c.consumption));
    const minConsumption = Math.min(...consumptions.map(c => c.consumption));

    // 根据车型估算正常油耗范围
    const brand = currentVehicle?.brand || '通用';
    let normalRange = '7-10';
    if (brand.includes('丰田') || brand.includes('本田')) normalRange = '6-9';
    if (brand.includes('大众')) normalRange = '7-10';
    if (brand.includes('宝马') || brand.includes('奔驰')) normalRange = '9-13';
    if (brand.includes('比亚迪')) normalRange = '5-12';

    const status = avgConsumption < parseFloat(normalRange.split('-')[1])
      ? '✅ 油耗正常，低于同级别平均水平'
      : avgConsumption > parseFloat(normalRange.split('-')[1]) * 1.2
      ? '⚠️ 油耗偏高，建议检查'
      : '📊 油耗正常范围内';

    return `📊 ${currentVehicle?.brand || ''} ${currentVehicle?.model || ''} 油耗分析

【统计数据】
- 记录周期：${sorted[0].date} 至 ${sorted[sorted.length - 1].date}
- 加油次数：${vehicleFuelRecords.length} 次
- 总加油量：${fuelStats?.totalFuel.toFixed(1)} L
- 总行驶里程：${fuelStats?.totalMileage.toLocaleString()} km
- 平均油耗：${avgConsumption.toFixed(2)} L/100km

【油耗区间】
- 最低油耗：${minConsumption.toFixed(2)} L/100km
- 最高油耗：${maxConsumption.toFixed(2)} L/100km

【与同级别对比】
${brand}车型正常油耗参考：${normalRange} L/100km

【评估结果】
${status}
${(() => {
  const tankCap = currentVehicle?.fuelTankCapacity;
  if (!tankCap) return '';
  const anomalies: string[] = [];
  vehicleFuelRecords.forEach(r => {
    if (r.fuelAmount > tankCap * 1.05) {
      anomalies.push(`${r.date} 加油 ${r.fuelAmount}L 超过油箱容积 ${tankCap}L，请核实数据`);
    }
  });
  const lastFullTank = [...sorted].reverse().find(r => r.fullTank);
  let remainEstimate = '';
  if (lastFullTank) {
    const mileageSinceFull = (currentVehicle?.mileage ?? lastFullTank.mileage) - lastFullTank.mileage;
    const consumed = (avgConsumption / 100) * mileageSinceFull;
    const remain = tankCap - consumed;
    if (remain > 0) {
      remainEstimate = `\n\n【油箱状态估算】（基于油箱容积 ${tankCap}L）\n- 上次加满：${lastFullTank.date}\n- 估算已消耗：${consumed.toFixed(1)}L\n- 估算剩余：${remain.toFixed(1)}L（约可续航 ${Math.floor(remain / avgConsumption * 100)}km）`;
    }
  }
  return `${anomalies.length > 0 ? '\n\n【数据异常提醒】\n' + anomalies.join('\n') : ''}${remainEstimate}`;
})()}
${avgConsumption > parseFloat(normalRange.split('-')[1]) ? `
【建议检查项目】
1. 轮胎气压是否正常
2. 空气滤芯是否堵塞
3. 火花塞是否老化
4. 驾驶习惯是否有急加速
` : ''}`;
  };

  // 保养周期追踪问答
  const getCheckpointAnalysis = (): string => {
    if (vehicleCheckpoints.length === 0) {
      return `🔧 保养周期追踪

尚未设置保养周期。请到首页设置常规保养里程间隔，我会为您追踪每个保养节点的完成情况。`;
    }

    const completed = vehicleCheckpoints.filter(cp => cp.completed);
    const pending = vehicleCheckpoints.filter(cp => !cp.completed);
    const next = pending[0];
    const currentMileage = currentVehicle?.mileage || 0;

    // 根据里程推断哪些节点已逾期
    const overdue = pending.filter(cp => cp.mileage < currentMileage);

    let answer = `🔧 保养周期追踪报告

【总体进度】
- 总节点：${vehicleCheckpoints.length} 个
- 已完成：${completed.length} 个
- 待保养：${pending.length} 个`;

    if (overdue.length > 0) {
      answer += `\n- ⚠️ 已逾期：${overdue.length} 个（${overdue.map(cp => cp.mileage.toLocaleString() + 'km').join('、')}）`;
    }

    if (next) {
      const diff = next.mileage - currentMileage;
      answer += `\n\n【下次保养】\n- 目标里程：${next.mileage.toLocaleString()} km\n- 当前里程：${currentMileage.toLocaleString()} km\n- 剩余里程：${diff > 0 ? diff.toLocaleString() + ' km' : '已逾期 ' + Math.abs(diff).toLocaleString() + ' km'}\n`;

      // 根据节点里程推断应做项目
      const cycleIndex = Math.floor(next.mileage / (currentVehicle?.mileageInterval || 10000));
      if (cycleIndex % 2 === 0) {
        answer += `- 建议项目：更换机油、机滤、常规检查（小保养）`;
      } else {
        answer += `- 建议项目：更换机油、机滤、空滤、空调滤（大保养项目视车况而定）`;
      }
    }

    if (completed.length > 0) {
      answer += `\n\n【已完成节点】\n${completed.slice(-5).map(cp => {
        const dateStr = cp.date ? `（${cp.date}）` : '';
        const projStr = cp.projects && cp.projects.length > 0 ? ` - ${cp.projects.join('、')}` : '';
        return `- ${cp.mileage.toLocaleString()} km${dateStr}${projStr}`;
      }).join('\n')}`;
    }

    return answer;
  };

  // 获取回答
  const getAnswer = (question: string): string | null => {
    const lowerQuestion = question.toLowerCase();

    // 0a. 保养周期相关问题
    const CHECKPOINT_KEYWORDS = ['保养周期', '下次保养', '保养节点', '保养追踪', '保养进度', '什么时候保养'];
    if (CHECKPOINT_KEYWORDS.some(kw => lowerQuestion.includes(kw))) {
      return getCheckpointAnalysis();
    }

    // 0b. 油耗相关问题优先处理
    if (FUEL_KEYWORDS.some(kw => lowerQuestion.includes(kw))) {
      return getFuelAnalysis();
    }

    // 1. 优先匹配具体品牌+保养项目（如"丰田用什么机油"）
    const askedBrand = detectBrand(question);
    const currentVehicleBrand = getVehicleBrand(currentVehicle);
    const targetBrand = askedBrand || currentVehicleBrand;
    const brandInfo = targetBrand ? BRAND_KNOWLEDGE[targetBrand] : null;

    // 2. 匹配通用保养知识
    for (const [, item] of Object.entries(GENERAL_KNOWLEDGE)) {
      if (item.keywords.some(kw => lowerQuestion.includes(kw))) {
        let answer = item.getAnswer(targetBrand || '通用', brandInfo || undefined);
        if (askedBrand && askedBrand !== currentVehicleBrand && brandInfo) {
          answer = `[${askedBrand}品牌建议]\n${answer}`;
        }
        return answer;
      }
    }

    // 3. 如果问到具体品牌但没有匹配到，给出该品牌的通用信息
    if (askedBrand && BRAND_KNOWLEDGE[askedBrand]) {
      const info = BRAND_KNOWLEDGE[askedBrand];
      return `${askedBrand}车型保养规格：\n- 机油规格：${info.oilSpec}\n- 推荐品牌：${info.oilBrand.join('、')}\n- 更换周期：${info.oilInterval}\n- 机滤品牌：${info.filterBrand.join('、')}\n${info.notes.map(n => `- ${n}`).join('\n')}`;
    }

    return null;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      // 1. 先尝试知识库
      const knowledgeAnswer = getAnswer(inputValue);

      if (knowledgeAnswer) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: knowledgeAnswer,
          timestamp: Date.now(),
        }]);
      } else {
        // 2. 知识库没有，返回通用建议
        await new Promise(resolve => setTimeout(resolve, 500));
        const reply = `关于您的问题，我需要了解更多细节才能给出准确建议。

建议：
1. 查看车辆说明书中的保养规格
2. 到品牌4S店咨询专业技师
3. 可以尝试问得更具体一些，例如：
   - "丰田用什么机油？"
   - "刹车片多久换？"`;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，暂时无法回答。请稍后再试。',
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    '这车用什么机油？',
    '保养周期是多少？',
    '刹车片多久换？',
    '我的油耗分析',
    '下次保养做什么？',
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* 聊天区域 */}
      <Card
        size="small"
        style={{ flex: 1, overflow: 'auto', borderRadius: 8 }}
        bodyStyle={{ height: '100%', overflow: 'auto', padding: '12px' }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 8,
                maxWidth: '85%',
              }}>
                <Avatar
                  icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#1677ff' : '#52c41a',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    background: msg.role === 'user' ? '#1677ff' : '#f6ffed',
                    color: msg.role === 'user' ? '#fff' : '#262626',
                    padding: '10px 14px',
                    borderRadius: 12,
                    borderTopRightRadius: msg.role === 'user' ? 4 : 12,
                    borderTopLeftRadius: msg.role === 'user' ? 12 : 4,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontSize: 14,
                  }}
                >
                  <Text style={{ color: msg.role === 'user' ? '#fff' : 'inherit' }}>
                    {msg.content}
                  </Text>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Space>
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                <Spin size="small" />
              </Space>
            </div>
          )}
          <div ref={chatEndRef} />
        </Space>
      </Card>

      {/* 快捷问题 */}
      {messages.length <= 1 && (
        <Card size="small" style={{ borderRadius: 8 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>常见问题：</Text>
          <Space wrap>
            {quickQuestions.map((q, i) => (
              <Button
                key={i}
                size="small"
                style={{ borderRadius: 16, fontSize: 12 }}
                onClick={() => setInputValue(q)}
              >
                {q}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* 输入区域 */}
      <Card size="small" style={{ borderRadius: 8 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入养车问题，例如：丰田用什么机油？油耗分析？刹车片多久换？"
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ borderRadius: 6 }}
          />
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
              disabled={!inputValue.trim()}
              style={{ borderRadius: 6 }}
            >
              发送
            </Button>
          </div>
        </Space>
      </Card>
    </Space>
  );
};

export default CarAssistantPage;
