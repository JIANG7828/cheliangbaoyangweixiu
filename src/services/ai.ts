// AI Service - 车辆保养智能分析服务
// 支持 OpenAI 兼容 API（可用于 GPT-4、通义千问、智谱等）

export interface AIOCRResult {
  date: string;
  location: string;
  mechanic: string;
  projects: { name: string; cost: number; quantity?: number; unitPrice?: number }[];
  confidence: number;
}

export interface AIBehaviorSuggestion {
  text: string;
  type: 'info' | 'warning' | 'success';
}

export interface AIPlanSuggestion {
  project: string;
  desc: string;
  nextDate: string;
  daysUntil: number;
  status: 'urgent' | 'upcoming' | 'planned';
  confidence: '高' | '中' | '低';
}

export interface AISummary {
  totalRecords: number;
  totalCost: number;
  avgCostPerRecord: number;
  topProjects: string[];
  suggestions: string[];
}

// API 配置 - 可通过环境变量配置
const AI_CONFIG = {
  // 使用模拟模式（无需 API Key）
  mockMode: process.env.REACT_APP_AI_MOCK_MODE !== 'false',
  
  // OpenAI 兼容 API 地址
  apiUrl: process.env.REACT_APP_AI_API_URL || 'https://api.openai.com/v1/chat/completions',
  
  // API Key
  apiKey: process.env.REACT_APP_AI_API_KEY || '',
  
  // 模型名称
  model: process.env.REACT_APP_AI_MODEL || 'gpt-4o-mini',
};

// 调用 AI API（纯文本）
async function callAI(prompt: string, maxTokens: number = 2000): Promise<string> {
  if (AI_CONFIG.mockMode) {
    console.log('[AI Mock] Prompt:', prompt);
    return '';
  }

  if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'your-api-key-here') {
    throw new Error('未配置 AI API Key，请在 .env 文件中设置 REACT_APP_AI_API_KEY');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(AI_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的车辆保养顾问，擅长分析保养记录和单据，给出专业建议。请用中文回复。',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查 .env 文件中的 REACT_APP_AI_API_KEY 配置');
      }
      throw new Error(`AI API 调用失败: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('AI 返回数据格式异常');
    }

    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('AI 请求超时，请检查网络连接或稍后重试');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到 AI 服务，请检查 API 地址配置和网络');
      }
      throw error;
    }
    throw new Error('AI 调用发生未知错误');
  }
}

// 调用 AI API（支持图片）
async function callAIWithImage(
  imageBase64: string,
  prompt: string,
  maxTokens: number = 2000
): Promise<string> {
  if (AI_CONFIG.mockMode) {
    console.log('[AI Mock] Image recognition');
    return '';
  }

  if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'your-api-key-here') {
    throw new Error('未配置 AI API Key，请在 .env 文件中设置 REACT_APP_AI_API_KEY');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(AI_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的车辆保养顾问，擅长分析保养记录和单据，给出专业建议。请用中文回复。',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查 .env 文件中的 REACT_APP_AI_API_KEY 配置');
      }
      throw new Error(`AI API 调用失败: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('AI 返回数据格式异常');
    }

    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('AI 请求超时，请检查网络连接或稍后重试');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到 AI 服务，请检查 API 地址配置和网络');
      }
      throw error;
    }
    throw new Error('AI 调用发生未知错误');
  }
}

// 图片转 Base64
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 解析 JSON 响应
function parseJSON<T>(text: string): T | null {
  try {
    // 尝试提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return null;
  } catch {
    return null;
  }
}

// AI OCR 识别 - 从单据照片提取信息（支持图片）
export async function recognizeReceipt(
  imageBase64OrDescription: string,
  isImage: boolean = false
): Promise<AIOCRResult> {
  if (AI_CONFIG.mockMode) {
    // 模拟返回数据
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          location: '丰田4S店',
          mechanic: '张师傅',
          projects: [
            { name: '更换机油', cost: 350 },
            { name: '更换机滤', cost: 80 },
          ],
          confidence: 0.92,
        });
      }, 2000);
    });
  }

  let result: string;

  if (isImage) {
    // 使用图像识别
    const prompt = `
这是一张车辆保养/维修单据的照片，请仔细识别并提取以下信息：

1. 日期时间
2. 门店/地点名称
3. 维修人员姓名（如有）
4. 所有保养/维修项目及金额

⚠️ 重要提示：
- 如果单据上有数量和单价两列，必须用"数量 × 单价"计算总金额（cost字段）
- 如果某项目有多行相同名称（如"更换机油 × 3"），请合并为一行，cost = 数量 × 单价
- 如果只有单价没有数量，默认数量为1
- cost 字段必须填入计算后的总金额

示例：
- 单价 ¥350 × 数量 2 → cost: 700
- 单价 ¥120 × 数量 1 → cost: 120

请严格按照以下 JSON 格式返回，不要返回其他内容：
{
  "date": "日期时间，格式 YYYY-MM-DD HH:mm，如果无法识别则留空",
  "location": "门店/地点名称",
  "mechanic": "维修人员姓名，如果没有则留空",
  "projects": [
    {"name": "项目名称", "cost": 计算后的总金额, "quantity": 数量(如有), "unitPrice": 单价(如有)}
  ],
  "confidence": 0.92
}
`;
    result = await callAIWithImage(imageBase64OrDescription, prompt, 1500);
  } else {
    // 使用文本识别
    const prompt = `
请从以下保养/维修单据描述中提取关键信息，并以 JSON 格式返回：

单据描述：
${imageBase64OrDescription}

请严格按照以下 JSON 格式返回，不要返回其他内容：
{
  "date": "日期时间，格式 YYYY-MM-DD HH:mm，如果没有则用当前日期",
  "location": "门店/地点名称",
  "mechanic": "维修人员姓名，如果没有则留空",
  "projects": [
    {"name": "项目名称", "cost": 金额数字}
  ],
  "confidence": 0.92
}
`;
    result = await callAI(prompt);
  }

  const parsed = parseJSON<AIOCRResult>(result);
  
  if (!parsed || !parsed.projects || parsed.projects.length === 0) {
    throw new Error('AI 识别结果格式不正确，请重试');
  }

  return parsed;
}

// AI 保养建议生成
export async function generateSuggestions(
  currentRecord: { projects: string[] },
  historyRecords: Array<{ projects: Array<{ name: string }>; date: string }>
): Promise<AIBehaviorSuggestion[]> {
  if (AI_CONFIG.mockMode) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { text: '根据单据内容，建议同时检查刹车油状态', type: 'info' },
          { text: '上次更换空滤已超过8000公里，建议检查', type: 'warning' },
        ]);
      }, 1000);
    });
  }

  const recentProjects = historyRecords
    .slice(0, 5)
    .map((r) => r.projects.map((p) => p.name))
    .flat();

  const prompt = `
根据以下车辆保养记录，给出2-3条专业的保养建议：

本次保养项目：${currentRecord.projects.join('、')}

最近保养历史项目：${recentProjects.join('、')}

请以 JSON 数组格式返回建议：
[
  {"text": "建议内容", "type": "info|warning|success"}
]
`;

  const result = await callAI(prompt, 500);
  const parsed = parseJSON<AIBehaviorSuggestion[]>(result);
  
  return parsed || [
    { text: '建议定期检查车辆状态', type: 'info' },
  ];
}

// AI 保养计划生成
export async function generateMaintenancePlan(
  vehicleInfo: { mileage: number; brand: string; model: string; year: number },
  historyRecords: Array<{ projects: Array<{ name: string }>; date: string; totalCost: number }>
): Promise<AIPlanSuggestion[]> {
  if (AI_CONFIG.mockMode) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const today = new Date()
        const urgentDate = new Date(today)
        urgentDate.setDate(today.getDate() + 3)
        const upcomingDate = new Date(today)
        upcomingDate.setDate(today.getDate() + 21)
        const plannedDate = new Date(today)
        plannedDate.setDate(today.getDate() + 60)

        const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

        resolve([
          {
            project: '更换机油机滤',
            desc: '常规保养，保持发动机最佳状态',
            nextDate: formatDate(urgentDate),
            daysUntil: 3,
            status: 'urgent' as const,
            confidence: '高' as const,
          },
          {
            project: '更换空调滤芯',
            desc: '夏季将至，建议提前更换保证空调效果',
            nextDate: formatDate(upcomingDate),
            daysUntil: 21,
            status: 'upcoming' as const,
            confidence: '中' as const,
          },
          {
            project: '更换刹车油',
            desc: '刹车油建议每2年更换一次',
            nextDate: formatDate(plannedDate),
            daysUntil: 60,
            status: 'planned' as const,
            confidence: '低' as const,
          },
        ]);
      }, 1500);
    });
  }

  const prompt = `
作为专业车辆保养顾问，请根据以下车辆信息和历史记录，生成未来3个月的保养计划：

车辆信息：
- 品牌型号：${vehicleInfo.brand} ${vehicleInfo.model}
- 年份：${vehicleInfo.year}
- 当前里程：${vehicleInfo.mileage}公里

最近保养记录：
${historyRecords
  .slice(0, 10)
  .map((r) => `- ${r.date}: ${r.projects.map((p) => p.name).join('、')} (¥${r.totalCost})`)
  .join('\n')}

请以 JSON 数组格式返回保养计划（3-5条）：
[
  {
    "project": "保养项目名称",
    "desc": "保养说明",
    "nextDate": "YYYY-MM-DD",
    "daysUntil": 天数,
    "status": "urgent|upcoming|planned",
    "confidence": "高|中|低"
  }
]
`;

  const result = await callAI(prompt, 1000);
  const parsed = parseJSON<AIPlanSuggestion[]>(result);
  
  return parsed || [];
}

// AI 车辆健康报告
export async function generateVehicleSummary(
  vehicleInfo: { brand: string; model: string; mileage: number },
  records: Array<{ projects: Array<{ name: string; cost: number }>; date: string; totalCost: number }>
): Promise<AISummary> {
  if (AI_CONFIG.mockMode) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalCost = records.reduce((sum, r) => sum + r.totalCost, 0);
        resolve({
          totalRecords: records.length,
          totalCost,
          avgCostPerRecord: records.length > 0 ? totalCost / records.length : 0,
          topProjects: ['更换机油', '更换机滤', '更换空滤'],
          suggestions: [
            '建议定期检查轮胎磨损情况',
            '刹车片使用寿命约剩30%',
          ],
        });
      }, 1000);
    });
  }

  const prompt = `
请分析以下车辆保养记录，生成智能摘要报告：

车辆信息：${vehicleInfo.brand} ${vehicleInfo.model}，里程：${vehicleInfo.mileage}公里

保养记录：
${records
  .map((r) => `- ${r.date}: ${r.projects.map((p) => `${p.name}(¥${p.cost})`).join('、')} 总计¥${r.totalCost}`)
  .join('\n')}

请以 JSON 格式返回：
{
  "totalRecords": 记录总数,
  "totalCost": 总花费,
  "avgCostPerRecord": 平均每次花费,
  "topProjects": ["最常做的前3个项目"],
  "suggestions": ["2-3条保养建议"]
}
`;

  const result = await callAI(prompt, 1000);
  const parsed = parseJSON<AISummary>(result);
  
  if (!parsed) {
    throw new Error('AI 分析结果格式不正确');
  }

  return parsed;
}
