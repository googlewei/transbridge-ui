# TransBridge UI


TransBridge UI 是 TransBridge 项目的官方前端界面，基于 React + TypeScript + Vite 构建，提供文本翻译和手写文字识别功能。

## 相关项目

- [TransBridge](https://github.com/fruitbars/transbridge) - TransBridge 后端服务

## 功能特点

- 文本翻译功能（支持多种语言互译）
- 手写文字识别（基于百度 OCR API）
- 响应式设计，支持多端适配
- 现代化 UI 界面，基于 Tailwind CSS
- 完整的 TypeScript 类型支持
- 开发环境热重载

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios

## 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

## 快速开始

1. 克隆项目
```bash
git clone https://github.com/homestoo/transbridge-ui.git
cd transbridge-ui
```

2. 安装依赖
```bash
npm install
# 或
yarn install
```

3. 配置环境变量
```bash
# 复制环境变量示例文件
cp .env.example .env
```

然后编辑 `.env` 文件，填入您的实际配置：
```env
# API 基础配置
REACT_APP_API_BASE_URL=http://localhost:3000  # 开发环境默认地址，生产环境请修改为实际地址
# 翻译服务 API 密钥
REACT_APP_TRANSLATE_API_KEY=your_translate_api_key

# Baidu OCR API 配置
REACT_APP_BAIDU_API_KEY=your_baidu_api_key
REACT_APP_BAIDU_SECRET_KEY=your_baidu_secret_key
REACT_APP_BAIDU_OCR_URL=https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting
REACT_APP_BAIDU_TOKEN_URL=https://aip.baidubce.com/oauth/2.0/token
```

## 开发

启动开发服务器：
```bash
npm start
# 或
yarn start
```

## 构建

构建生产版本：
```bash
npm run build
# 或
yarn build
```


##TransBridge API 文档

项目提供了完整的 API 文档入口，您可以通过以下方式访问：


   - 访问 `http://localhost:3000/api-docs.html` 查看 API 文档




API 文档提供了以下功能：
- 详细的接口说明和参数描述
- 在线接口调试功能
- 请求/响应示例
- 错误码说明
- 认证方式说明

## API 使用说明

### 翻译服务 API
transapi:
  tokens:
    - ""

 将密钥填入 `.env` 文件的 `REACT_APP_TRANSLATE_API_KEY` 中



配置说明：
1. 开发环境：
   - 默认代理到 `http://localhost:3000`
   - 与 `.env` 中的 `REACT_APP_API_BASE_URL` 保持一致

2. 生产环境：
   - 修改 `proxy_pass` 为实际的 API 服务器地址
   - 同时更新 `.env` 中的 `REACT_APP_API_BASE_URL`

## 注意事项

1. 使用前请确保已获取必要的 API 密钥：
   - 翻译服务 API 密钥
   - 百度 OCR API 密钥和密钥

2. 开发环境配置：
   - 项目默认使用 `localhost:3000` 作为开发服务器
   - 已配置代理以处理 API 请求
   - 生产环境部署时请修改 `REACT_APP_API_BASE_URL` 为实际的 API 地址

3. 生产环境部署：
   - 建议使用 HTTPS
   - 确保正确配置环境变量
   - 使用 Nginx 作为反向代理（配置文件已提供）


## 项目结构

```
transbridge-ui/
├── src/                # 源代码目录
│   ├── components/    # React 组件
│   ├── pages/        # 页面组件
│   ├── services/     # API 服务
│   ├── types/        # TypeScript 类型定义
│   └── utils/        # 工具函数
├── public/           # 静态资源
└── ...配置文件
```



## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

MIT License


