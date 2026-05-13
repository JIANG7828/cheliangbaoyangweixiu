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

// ==================== 安全配置 ====================

// 免费模型白名单（仅允许使用这些模型，防止意外扣费）
const FREE_MODELS = [
  'qwen-vl-plus',      // 视觉模型，100万token免费
  'qwen-plus',         // 纯文本旗舰模型
  'qwen-turbo',        // 轻量快速模型
  'qwen-max',          // 最新旗舰（可能有免费额度）
  'qwen-max-longcontext', // 长上下文版本
];

// 付费模型黑名单（这些模型不在免费范围内）
const PAID_MODELS = [
  'qwen-vl2-plus',     // ❌ 付费模型
  'qwen-vl2-72b',     // ❌ 付费模型
  'qwen-vl-max',       // ❌ 付费模型
  'qwen2-72b',        // ❌ 付费模型
  'qwen2.5-72b',      // ❌ 付费模型
];

// ==================== 模型安全检查 ====================

function validateModelSafety(modelName: string): void {
  const model = modelName.toLowerCase();

  // 检查是否在付费黑名单
  for (const paidModel of PAID_MODELS) {
    if (model.includes(paidModel.toLowerCase())) {
      console.error(`[AI 安全警告] 模型 ${modelName} 在付费黑名单中，可能导致意外扣费！`);
      console.error(`[AI 安全警告] 当前代码已限制只能使用免费模型`);
    }
  }

  // 检查是否在免费白名单
  const isFreeModel = FREE_MODELS.some(free =>
    model.includes(free.toLowerCase())
  );

  if (isFreeModel) {
    console.log(`[AI] ✓ 模型 ${modelName} 在免费白名单中`);
  } else {
    console.warn(`[AI] ⚠️ 模型 ${modelName} 不在免费白名单，请确认是否有免费额度`);
  }
}

// ==================== API 配置 ====================

// API 配置 - 可通过环境变量配置
const AI_CONFIG = {
  // 强制使用真实 API（设为 false 使用模拟模式）
  mockMode: process.env.REACT_APP_AI_MOCK_MODE === 'true',

  // OpenAI 兼容 API 地址（DashScope 兼容模式）
  apiUrl: process.env.REACT_APP_AI_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',

  // API Key
  apiKey: process.env.REACT_APP_AI_API_KEY || '',

  // 模型名称（仅使用免费模型！）
  model: process.env.REACT_APP_AI_MODEL || 'qwen-vl-plus',
};

// 启动时验证模型安全性
validateModelSafety(AI_CONFIG.model);

console.log('[AI Config]', {
  mockMode: AI_CONFIG.mockMode,
  apiUrl: AI_CONFIG.apiUrl,
  model: AI_CONFIG.model,
  hasApiKey: !!AI_CONFIG.apiKey,
  apiKeyPrefix: AI_CONFIG.apiKey ? AI_CONFIG.apiKey.substring(0, 10) : 'none',
});

// 检测是否为通义千问 API
const isQwenAPI = AI_CONFIG.apiUrl.includes('dashscope') || AI_CONFIG.apiUrl.includes('qwen');
console.log('[AI] Is Qwen API:', isQwenAPI);

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
    // Mock 模式：直接返回空，让 recognizeReceipt 的 mock 层处理
    return '';
  }

  if (!AI_CONFIG.apiKey || AI_CONFIG.apiKey === 'your-api-key-here') {
    throw new Error('未配置 AI API Key，请在 .env 文件中设置 REACT_APP_AI_API_KEY');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 增加超时到60秒

  try {
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 通义千问需要特定的 Authorization 格式
    if (isQwenAPI) {
      headers['Authorization'] = `Bearer ${AI_CONFIG.apiKey}`;
    } else {
      headers['Authorization'] = `Bearer ${AI_CONFIG.apiKey}`;
    }

    // 通义千问 API 格式
    const requestBody: any = {
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的车辆保养顾问，擅长分析保养记录和单据，给出专业建议。请用中文回复，只返回JSON格式。',
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
      stream: false,
    };

    console.log('[AI] === 开始调用通义千问视觉模型 ===');
    console.log('[AI] Model:', AI_CONFIG.model);
    console.log('[AI] API URL:', AI_CONFIG.apiUrl);
    console.log('[AI] Image length:', imageBase64.length, 'chars');
    console.log('[AI] Headers:', JSON.stringify({ ...headers, Authorization: headers.Authorization ? '[HIDDEN]' : 'none' }));

    const response = await fetch(AI_CONFIG.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[AI] Response status:', response.status);
    console.log('[AI] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] Response error body:', errorText);
      
      if (response.status === 401) {
        throw new Error(`API Key无效或已过期 (401)。请检查：\n1. API Key是否正确\n2. API Key是否有余额\n3. 模型是否对该Key可用`);
      }
      if (response.status === 403) {
        throw new Error(`API访问被拒绝 (403)。可能原因：\n1. API Key没有该模型的权限\n2. 账户余额不足`);
      }
      if (response.status === 400) {
        // 尝试解析错误信息
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.error?.message) {
            throw new Error(`请求参数错误 (400): ${errJson.error.message}`);
          }
        } catch {}
        throw new Error(`请求参数错误 (400): ${errorText.substring(0, 200)}`);
      }
      if (response.status === 429) {
        throw new Error(`请求过于频繁 (429)，请稍后重试`);
      }
      throw new Error(`AI API 调用失败: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('[AI] Response keys:', Object.keys(data));
    
    if (data.error) {
      console.error('[AI] API error:', data.error);
      throw new Error(`API错误: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // 尝试多种可能的返回格式
    let content = '';
    
    // 格式1: OpenAI 兼容格式
    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content;
      console.log('[AI] Using OpenAI format');
    }
    // 格式2: DashScope 旧版格式
    else if (data.output && data.output.choices && data.output.choices[0]) {
      content = data.output.choices[0].message?.content || data.output.choices[0].text || '';
      console.log('[AI] Using DashScope output format');
    }
    // 格式3: 直接 content
    else if (data.content) {
      content = data.content;
      console.log('[AI] Using direct content');
    }
    // 格式4: text 字段
    else if (data.text) {
      content = data.text;
      console.log('[AI] Using text field');
    }
    
    console.log('[AI] Extracted content length:', content?.length || 0);
    console.log('[AI] Content preview:', content?.substring(0, 200) || 'EMPTY');

    if (!content) {
      console.error('[AI] Full response:', JSON.stringify(data).substring(0, 1000));
      throw new Error('AI 返回内容为空，请检查 API 响应格式');
    }

    return content;
  } catch (error) {
    clearTimeout(timeoutId);

    console.error('[AI] Error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('AI 请求超时，请检查网络连接或稍后重试');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到 AI 服务，请检查 API 地址配置和网络');
      }
      throw error;
    }
    throw new Error('AI 调用发生未知错误: ' + String(error));
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
  console.log('[AI] recognizeReceipt called, isImage:', isImage);
  console.log('[AI] mockMode:', AI_CONFIG.mockMode);
  console.log('[AI] API URL:', AI_CONFIG.apiUrl);
  console.log('[AI] Model:', AI_CONFIG.model);

  if (AI_CONFIG.mockMode) {
    // 模拟返回数据
    console.log('[AI] Using mock mode');
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
    console.log('[AI] Starting image recognition...');
    const prompt = `
这是一张车辆保养/维修单据的照片，请仔细识别并提取以下信息：

1. 日期时间
2. 门店/地点名称
3. 维修人员姓名（如有）
4. 所有保养/维修项目及金额

重要提示：
- 如果单据上有数量和单价两列，必须用"数量 × 单价"计算总金额（cost字段）
- 如果某项目有多行相同名称（如"更换机油 × 3"），请合并为一行，cost = 数量 × 单价
- 如果只有单价没有数量，默认数量为1
- cost 字段必须填入计算后的总金额
- 日期格式：YYYY-MM-DD HH:mm

请严格按照以下 JSON 格式返回，不要返回其他内容：
{
  "date": "日期时间，格式 YYYY-MM-DD HH:mm，如果无法识别则留空",
  "location": "门店/地点名称，如果无法识别则留空",
  "mechanic": "维修人员姓名，如果没有则留空",
  "projects": [
    {"name": "项目名称", "cost": 计算后的总金额数字, "quantity": 数量(如有), "unitPrice": 单价(如有)}
  ],
  "confidence": 0.92
}
`;
    console.log('[AI] Calling callAIWithImage with prompt...');
    try {
      result = await callAIWithImage(imageBase64OrDescription, prompt, 2000);
      console.log('[AI] callAIWithImage returned:', result?.substring(0, 500));
    } catch (err) {
      console.error('[AI] callAIWithImage error:', err);
      // 显示更友好的错误提示（需要调用方处理UI提示）
      const errorMsg = (err as Error).message || '';
      if (errorMsg.includes('401') || errorMsg.includes('API Key无效')) {
        throw new Error('API Key无效或已过期，请检查通义千问控制台 (dashscope.console.aliyun.com)');
      } else if (errorMsg.includes('403') || errorMsg.includes('访问被拒绝')) {
        throw new Error('API访问被拒绝，可能是余额不足或权限问题');
      } else if (errorMsg.includes('400') || errorMsg.includes('参数错误')) {
        throw new Error('请求参数错误，请检查模型名称是否正确');
      } else if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
        throw new Error('请求超时，请检查网络后重试');
      }
      throw err;
    }
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
    console.error('[AI] Parse failed, raw result:', result);
    throw new Error('AI 识别结果格式不正确，请重试或检查单据照片是否清晰');
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
