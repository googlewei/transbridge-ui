# TransBridge UI

TransBridge UI 是一个基于 React 的翻译工具前端界面，支持文本翻译和手写文字识别功能。
TransBridge项目地址： [https://github.com/fruitbars/transbridge#readme]

## 功能特点

- 文本翻译功能
- 手写文字识别（基于百度 OCR API）
- 响应式设计
- 现代化 UI 界面

## 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0 或 yarn >= 1.22.0

## 安装步骤

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

## API 使用说明

### 1. 翻译服务 API
transapi:
  tokens:
    - ""

4. 将密钥填入 `.env` 文件的 `REACT_APP_TRANSLATE_API_KEY` 中



## API 代理配置

项目使用 Nginx 作为反向代理，配置文件位于 `nginx.conf`。主要配置说明：

```nginx
# API 代理配置
location /api/ {
    proxy_pass http://localhost:3000/;  # 开发环境地址，生产环境请修改为实际地址
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

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

## 技术支持

如有问题，请提交 Issue 或联系技术支持。

## 许可证

[许可证类型]
