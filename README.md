# 用于本地 LLM 的网页搜索 MCP 服务器

一个 TypeScript MCP（模型上下文协议）服务器，提供全面的网页搜索功能，使用直接连接（无需 API 密钥），并为不同使用场景提供多种工具。

## 功能特性

- **多引擎网页搜索**：优先级为 Bing > Brave > DuckDuckGo，以获得最佳可靠性和性能
- **完整页面内容提取**：从搜索结果中获取并提取完整的页面内容
- **多种搜索工具**：三个针对不同使用场景的专用工具
- **智能请求策略**：在 playwright 浏览器和快速 axios 请求之间切换以确保返回结果
- **并发处理**：同时从多个页面提取内容

## 工作原理

该服务器为不同的网页搜索需求提供三个专用工具：

### 1. `full-web-search`（主要工具）
当请求进行全面搜索时，服务器使用**优化的搜索策略**：
1. **基于浏览器的 Bing 搜索** - 使用专用 Chromium 实例的主要方法
2. **基于浏览器的 Brave 搜索** - 使用专用 Firefox 实例的次要选项
3. **Axios DuckDuckGo 搜索** - 使用传统 HTTP 的最终备用方案
4. **专用浏览器隔离**：每个搜索引擎都有自己的浏览器实例，并自动清理
5. **内容提取**：首先尝试 axios，然后回退到具有人类行为模拟的浏览器
6. **并发处理**：同时从多个页面提取内容，并带有超时保护
7. **HTTP/2 错误恢复**：当协议错误发生时自动回退到 HTTP/1.1

### 2. `get-web-search-summaries`（轻量级替代方案）
用于快速搜索结果而不提取完整内容：
1. 执行与 `full-web-search` 相同的优化多引擎搜索
2. 仅返回搜索结果摘要/描述
3. 不跟踪链接以提取完整页面内容

### 3. `get-single-web-page-content`（实用工具）
用于从特定网页提取内容：
1. 接受单个 URL 作为输入
2. 跟踪 URL 并提取主要页面内容
3. 删除导航、广告和其他非内容元素

## 运行模式

此 MCP 服务器支持两种运行模式：

### 1. Stdio 模式（默认）
通过标准输入/输出（stdio）与 MCP 客户端通信，适用于 Claude Desktop、LM Studio 等桌面应用。

### 2. HTTP 服务器模式（新增）
通过 HTTP/SSE 提供 MCP 服务，适用于 Dify、Web 应用等需要网络访问的场景。

## 兼容性

此 MCP 服务器已使用 **LM Studio**、**LibreChat** 和 **Dify** 进行开发和测试。尚未在其他 MCP 客户端上进行测试。

### 模型兼容性
**重要提示：** 优先使用指定用于工具使用的较新模型。

较旧的模型（即使那些指定了工具使用的模型）可能无法工作或工作不稳定。Llama 和 Deepseek 似乎就是这种情况。Qwen3 和 Gemma 3 目前有最好的结果。

- ✅ 效果很好：**Qwen3**
- ✅ 效果很好：**Gemma 3**
- ✅ 可用：**Llama 3.2**
- ✅ 可用：最新的 **Llama 3.1**（例如 3.1 swallow-8B）
- ✅ 可用：最新的 **Deepseek R1**（例如 0528 版本可用）
- ⚠️ 可能有问题：某些版本的 **Llama** 和 **Deepseek R1**
- ❌ 可能无法工作：较旧版本的 **Llama** 和 **Deepseek R1**

## 安装（推荐）

**要求：**
- Node.js 18.0.0 或更高版本
- npm 8.0.0 或更高版本

1. 从 [发布页面](https://github.com/mrkrsl/web-search-mcp/releases) 下载最新的发布 zip 文件
2. 将 zip 文件解压到系统上的某个位置（例如 `~/mcp-servers/web-search-mcp/`）
3. **在解压的文件夹中打开终端并运行：**
   ```bash
   npm install
   npx playwright install
   npm run build
   ```
   这将创建一个包含所有必需依赖项的 `node_modules` 文件夹，安装 Playwright 浏览器，并构建项目。

   **注意：** 您必须在解压文件夹的根目录中运行 `npm install`（不是在 `dist/` 中）。
4. 配置您的 `mcp.json` 以指向解压的 `dist/index.js` 文件：

```json
{
  "mcpServers": {
    "web-search": {
      "command": "node",
      "args": ["/path/to/extracted/web-search-mcp/dist/index.js"]
    }
  }
}
```
**路径示例：**
- macOS/Linux：`~/mcp-servers/web-search-mcp/dist/index.js`
- Windows：`C:\\mcp-servers\\web-search-mcp\\dist\\index.js`

在 LibreChat 中，您可以在 librechat.yaml 中包含 MCP 服务器。如果您在 Docker 中运行 LibreChat，必须首先在 docker-compose.override.yml 中挂载您的本地目录。

在 `docker-compose.override.yml` 中：
```yaml
services:
  api:
    volumes:
    - type: bind
      source: /path/to/your/mcp/directory
      target: /app/mcp
```
在 `librechat.yaml` 中：
```yaml
mcpServers:
  web-search:
    type: stdio
    command: node
    args:
    - /app/mcp/web-search-mcp/dist/index.js
    serverInstructions: true
```

**故障排除：**
- 如果 `npm install` 失败，请尝试将 Node.js 更新到 18+ 版本，npm 更新到 8+ 版本
- 如果 `npm run build` 失败，请确保您安装了最新的 Node.js 版本
- 对于较旧的 Node.js 版本，您可能需要使用此项目的较旧版本
- **内容长度问题：** 如果您由于内容长度限制而遇到奇怪的行为，请尝试在 `mcp.json` 环境变量中设置 `"MAX_CONTENT_LENGTH": "10000"` 或其他值：

```json
{
  "mcpServers": {
    "web-search": {
      "command": "node",
      "args": ["/path/to/web-search-mcp/dist/index.js"],
      "env": {
        "MAX_CONTENT_LENGTH": "10000",
        "BROWSER_HEADLESS": "true",
        "MAX_BROWSERS": "3",
        "BROWSER_FALLBACK_THRESHOLD": "3"
      }
    }
  }
}
```

## 环境变量

服务器支持多个用于配置的环境变量：

- **`MAX_CONTENT_LENGTH`**：最大内容长度（字符数）（默认：500000）
- **`DEFAULT_TIMEOUT`**：请求的默认超时时间（毫秒）（默认：6000）
- **`MAX_BROWSERS`**：维护的最大浏览器实例数（默认：3）
- **`BROWSER_TYPES`**：要使用的浏览器类型的逗号分隔列表（默认：'chromium,firefox'，选项：chromium、firefox、webkit）
- **`BROWSER_FALLBACK_THRESHOLD`**：使用浏览器备用方案之前的 axios 失败次数（默认：3）

### 搜索质量和引擎选择

- **`ENABLE_RELEVANCE_CHECKING`**：启用/禁用搜索结果质量验证（默认：true）
- **`RELEVANCE_THRESHOLD`**：搜索结果的最低质量分数（0.0-1.0，默认：0.3）
- **`FORCE_MULTI_ENGINE_SEARCH`**：尝试所有搜索引擎并返回最佳结果（默认：false）
- **`DEBUG_BROWSER_LIFECYCLE`**：启用详细的浏览器生命周期日志记录以进行调试（默认：false）

## 故障排除

### 响应时间慢
- **优化的超时时间**：默认超时时间减少到 6 秒，并发处理以获得更快的结果
- **并发提取**：现在同时从多个页面提取内容
- **进一步减少超时时间**：设置 `DEFAULT_TIMEOUT=4000` 以获得更快的响应（可能会降低成功率）
- **使用更少的浏览器**：设置 `MAX_BROWSERS=1` 以减少内存使用

### 搜索失败
- **检查浏览器安装**：运行 `npx playwright install` 以确保浏览器可用
- **尝试无头模式**：确保 `BROWSER_HEADLESS=true`（默认）用于服务器环境
- **网络限制**：某些网络阻止浏览器自动化 - 尝试不同的网络或 VPN
- **HTTP/2 问题**：服务器自动处理 HTTP/2 协议错误，并回退到 HTTP/1.1

### 搜索质量问题
- **启用质量检查**：设置 `ENABLE_RELEVANCE_CHECKING=true`（默认启用）
- **调整质量阈值**：设置 `RELEVANCE_THRESHOLD=0.5` 以获得更严格的质量要求
- **强制多引擎搜索**：设置 `FORCE_MULTI_ENGINE_SEARCH=true` 以尝试所有引擎并返回最佳结果

### 内存使用
- **自动清理**：每次操作后自动清理浏览器以防止内存泄漏
- **限制浏览器**：减少 `MAX_BROWSERS`（默认：3）
- **EventEmitter 警告**：已修复 - 浏览器正确关闭以防止监听器积累

## 开发环境
```bash
git clone https://github.com/mrkrsl/web-search-mcp.git
cd web-search-mcp
npm install
npx playwright install
npm run build
```

## 开发

```bash
npm run dev    # 热重载开发模式
npm run build  # 将 TypeScript 构建为 JavaScript
npm run lint   # 运行 ESLint
npm run format # 运行 Prettier
```

## MCP 工具

此服务器为不同的网页搜索需求提供三个专用工具：

### 1. `full-web-search`（主要工具）
最全面的网页搜索工具：
1. 接受搜索查询和可选的结果数量（1-10，默认 5）
2. 执行网页搜索（如果需要，尝试 Bing，然后 Brave，然后 DuckDuckGo）
3. 通过并发处理从每个结果 URL 获取完整页面内容
4. 返回包含搜索结果和提取内容的结构化数据
5. **增强的可靠性**：HTTP/2 错误恢复、减少的超时时间和更好的错误处理

**使用示例：**
```json
{
  "name": "full-web-search",
  "arguments": {
    "query": "TypeScript MCP server",
    "limit": 3,
    "includeContent": true
  }
}
```

### 2. `get-web-search-summaries`（轻量级替代方案）
快速搜索结果的轻量级替代方案：
1. 接受搜索查询和可选的结果数量（1-10，默认 5）
2. 执行与 `full-web-search` 相同的优化多引擎搜索
3. 仅返回搜索结果摘要/描述（不提取内容）
4. 更快、更高效，适用于快速研究

**使用示例：**
```json
{
  "name": "get-web-search-summaries",
  "arguments": {
    "query": "TypeScript MCP server",
    "limit": 5
  }
}
```

### 3. `get-single-web-page-content`（实用工具）
从特定网页提取内容的实用工具：
1. 接受单个 URL 作为输入
2. 跟踪 URL 并提取主要页面内容
3. 删除导航、广告和其他非内容元素
4. 用于从已知网页获取详细内容

**使用示例：**
```json
{
  "name": "get-single-web-page-content",
  "arguments": {
    "url": "https://example.com/article",
    "maxContentLength": 5000
  }
}
```

## HTTP 服务器模式使用（供 Dify 调用）

### 安装和启动

1. **安装依赖并构建**
```bash
npm install
npx playwright install chromium firefox
npm run build
```

2. **配置环境变量**

创建 `.env` 文件或直接在命令行中设置：

```bash
# 必需配置
export API_KEY=your-secret-api-key-here

# 可选配置
export HTTP_PORT=3000
export ENABLE_CORS=true
export MAX_CONTENT_LENGTH=10000
export DEFAULT_TIMEOUT=6000
```

**环境变量说明：**
- `API_KEY` - **必需**，用于 API 认证的密钥
- `HTTP_PORT` - HTTP 服务器端口（默认：3000）
- `ENABLE_CORS` - 是否启用 CORS（默认：true）
- `MAX_CONTENT_LENGTH` - 最大内容长度（默认：500000）
- `DEFAULT_TIMEOUT` - 请求超时时间毫秒（默认：6000）

3. **启动 HTTP 服务器**

```bash
# 方式 1: 使用环境变量
API_KEY=your-secret-key pnpm start:http

# 方式 2: 从 .env 文件加载（需要安装 dotenv-cli）
pnpm add -g dotenv-cli
dotenv -e .env pnpm start:http

# 开发模式（热重载）
API_KEY=your-secret-key pnpm dev:http
```

启动后，你会看到：
```
🚀 Web Search MCP HTTP Server 已启动
📡 监听端口: 3000
🔒 API Key 认证: 已启用
🌐 CORS: 已启用
```

### 可用端点

#### 1. 健康检查
```bash
GET http://localhost:3000/health
```

响应：
```json
{
  "status": "ok",
  "service": "web-search-mcp-http",
  "version": "0.3.1",
  "timestamp": "2025-10-24T12:00:00.000Z"
}
```

#### 2. MCP over SSE 连接
```bash
GET http://localhost:3000/sse
Headers:
  X-API-Key: your-secret-key
```

此端点建立 SSE（Server-Sent Events）连接，用于 MCP 协议通信。

#### 3. SSE 消息端点
```bash
POST http://localhost:3000/message
Headers:
  X-API-Key: your-secret-key
  Content-Type: application/json
```

用于通过 SSE 发送 MCP 消息。

### Dify 集成配置

在 Dify 中配置 MCP 服务器：

1. **打开 Dify 设置**
2. **添加 MCP 服务器**
3. **配置连接信息：**

```yaml
名称: Web Search MCP
类型: HTTP (SSE)
URL: http://your-server-ip:3000/sse
认证方式: API Key
Headers:
  X-API-Key: your-secret-api-key-here
```

4. **测试连接**
   - 点击"测试连接"按钮
   - 应该看到"连接成功"消息
   - 可用工具列表会显示三个工具：
     - `full-web-search` - 完整搜索+内容提取
     - `get-web-search-summaries` - 轻量级搜索摘要
     - `get-single-web-page-content` - 单页内容提取

5. **在 Dify 工作流中使用**
   - 创建或编辑工作流
   - 添加"工具"节点
   - 选择"Web Search MCP"服务
   - 选择要使用的工具（例如 `full-web-search`）
   - 配置参数（query, limit 等）

### 安全建议

⚠️ **重要安全提示：**

1. **使用强 API Key**
   ```bash
   # 生成安全的随机 API Key
   openssl rand -base64 32
   ```

2. **使用 HTTPS**（生产环境）
   - 使用反向代理（Nginx、Caddy）添加 SSL/TLS
   - 示例 Nginx 配置：
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **IP 白名单**（可选）
   - 配置防火墙只允许特定 IP 访问
   - 或在 Nginx 中配置 IP 限制

4. **不要在公共代码库中提交 API Key**
   - 将 `.env` 添加到 `.gitignore`
   - 使用环境变量或密钥管理服务

### 测试 HTTP 服务器

使用 curl 测试服务器：

```bash
# 1. 测试健康检查（无需认证）
curl http://localhost:3000/health

# 2. 测试 SSE 连接（需要认证）
curl -H "X-API-Key: your-secret-key" \
     -N \
     http://localhost:3000/sse

# 3. 测试根路径（查看服务信息）
curl http://localhost:3000/
```

## Stdio 模式使用（默认）

您可以直接运行 stdio 模式服务器，用于 Claude Desktop、LM Studio 等：

```bash
# 启动 stdio 服务器
npm start

# 或开发模式
npm run dev
```

## 文档

有关完整的技术细节，请参阅 [API.md](./docs/API.md)。

## 许可证

MIT 许可证 - 有关详细信息，请参阅 [LICENSE](./LICENSE)。

## 反馈

这是一个开源项目，我们欢迎反馈！如果您遇到任何问题或有改进建议，请：

- 在 GitHub 上提交 issue
- 提交 pull request
