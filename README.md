# 车辆保养维修记录系统

基于 React + Ant Design 的车辆保养管理平台，支持保养记录、油耗统计、油价查询、AI 养车助理等功能。

## 功能特性

- **车辆管理**：登记车辆信息，设置保养间隔（5000/10000 km）
- **保养记录**：手动记录、拍照记录，支持查看历史
- **保养周期追踪**：按里程节点追踪保养状态，自动延伸节点
- **油耗记录**：记录加油信息，自动计算百公里油耗
- **油价查询**：实时查询本地油价
- **养车助理**：AI 智能分析车辆状况，生成保养建议
- **找回密码**：支持用户自设新密码

## 技术栈

- React 18 + TypeScript
- Ant Design 5
- React Router 6
- 本地存储（localStorage）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

## 在线演示

- GitHub Pages: https://JIANG7828.github.io/cheliangbaoyangweixiu
- Gitee Pages: https://jiangyanmin7828.gitee.io/cheliangbaoyangweixiu

## 默认账号

- 用户名：`admin`
- 密码：`123456`

## 项目截图

（待补充）

## 更新日志

### 2025-05-13
- 优化保养周期追踪逻辑，修复跨里程标记 bug
- 找回密码改为三步流程，支持用户自设新密码
- 登记车辆时可选保养间隔
- 新增油耗记录与油价查询功能
- 新增 AI 养车助理
