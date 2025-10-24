# 网页搜索 MCP 服务器 - API 文档

## 概述

网页搜索 MCP 服务器提供三个用于网页搜索和内容提取的工具：

1. **`full-web-search`** - 带有完整内容提取的全面网页搜索（主要工具）
2. **`get-web-search-summaries`** - 仅返回结果摘要的轻量级搜索
3. **`get-single-web-page-content`** - 从单个网页 URL 提取内容

## 工具：full-web-search

### 描述
搜索网页并从顶部结果获取完整的页面内容。这是最全面的网页搜索工具。它搜索网页，然后跟踪生成的链接以提取完整的页面内容，提供最详细和完整的可用信息。

### 输入架构
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "要执行的搜索查询（推荐用于全面研究）"
    },
    "limit": {
      "type": "number",
      "description": "返回包含完整内容的结果数量（1-10，默认 5）",
      "minimum": 1,
      "maximum": 10,
      "default": 5
    },
    "includeContent": {
      "type": "boolean",
      "description": "是否获取完整页面内容（默认：true）",
      "default": true
    },
    "maxContentLength": {
      "type": "number",
      "description": "每个结果内容的最大字符数（0 = 无限制）。通常不需要 - 内容长度会自动优化。",
      "optional": true
    }
  },
  "required": ["query"]
}
```

### 输出架构
返回包含搜索结果及完整页面内容的格式化文本内容：

```json
{
  "content": [
    {
      "type": "text",
      "text": "搜索"[query]"完成，共 [N] 个结果：\n\n**1. [Title]**\nURL: [url]\n描述：[description]\n\n**完整内容：**\n[extracted content]\n\n---\n\n..."
    }
  ]
}
```

### 使用示例

#### 基本搜索
```json
{
  "name": "full-web-search",
  "arguments": {
    "query": "TypeScript MCP server"
  }
}
```

#### 带有自定义参数的搜索
```json
{
  "name": "full-web-search",
  "arguments": {
    "query": "web development best practices",
    "limit": 8,
    "includeContent": true,
    "maxContentLength": 3000
  }
}
```

## 工具：get-web-search-summaries

### 描述
搜索网页并仅返回搜索结果摘要/描述，而不跟踪链接提取完整页面内容。当您只需要简要搜索结果时，这是 full-web-search 的轻量级替代方案。

### 输入架构
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "要执行的搜索查询（轻量级替代方案）"
    },
    "limit": {
      "type": "number",
      "description": "返回的搜索结果数量（1-10，默认 5）",
      "minimum": 1,
      "maximum": 10,
      "default": 5
    }
  },
  "required": ["query"]
}
```

### 输出架构
返回包含搜索结果摘要的格式化文本内容：

```json
{
  "content": [
    {
      "type": "text",
      "text": ""[query]"的搜索摘要，共 [N] 个结果：\n\n**1. [Title]**\nURL: [url]\n描述：[description]\n\n---\n\n..."
    }
  ]
}
```

### 使用示例

#### 基本摘要搜索
```json
{
  "name": "get-web-search-summaries",
  "arguments": {
    "query": "machine learning tutorials"
  }
}
```

#### 带有自定义限制的摘要搜索
```json
{
  "name": "get-web-search-summaries",
  "arguments": {
    "query": "React best practices",
    "limit": 3
  }
}
```

## 工具：get-single-web-page-content

### 描述
从单个网页 URL 提取并返回完整内容。此工具跟踪提供的 URL 并提取主要页面内容。在无需执行搜索的情况下从特定网页获取详细内容时非常有用。

### 输入架构
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "description": "要提取内容的网页 URL"
    },
    "maxContentLength": {
      "type": "number",
      "description": "提取内容的最大字符数（0 = 无限制，undefined = 使用默认限制）。通常不需要 - 内容长度会自动优化。",
      "optional": true
    }
  },
  "required": ["url"]
}
```

### 输出架构
返回指定网页的格式化文本内容：

```json
{
  "content": [
    {
      "type": "text",
      "text": "**页面内容来自：[url]**\n\n**标题：** [title]\n**字数：** [count]\n**内容长度：** [length] 个字符\n\n**内容：**\n[extracted content]"
    }
  ]
}
```

### 使用示例

#### 基本页面内容提取
```json
{
  "name": "get-single-web-page-content",
  "arguments": {
    "url": "https://example.com/article"
  }
}
```

#### 带有长度限制的页面内容
```json
{
  "name": "get-single-web-page-content",
  "arguments": {
    "url": "https://example.com/long-article",
    "maxContentLength": 2000
  }
}
```

## 响应示例

### full-web-search 响应
```json
{
  "content": [
    {
      "type": "text",
      "text": "搜索"TypeScript MCP server"完成，共 2 个结果：\n\n**1. TypeScript 入门**\nURL: https://www.typescriptlang.org/docs/\n描述：TypeScript 是一种基于 JavaScript 构建的强类型编程语言...\n\n**完整内容：**\nTypeScript 是一种基于 JavaScript 构建的强类型编程语言，可在任何规模下为您提供更好的工具。本教程将帮助您开始使用 TypeScript...\n\n---\n\n**2. 模型上下文协议文档**\nURL: https://modelcontextprotocol.io/\n描述：模型上下文协议（MCP）是一种让 AI 助手连接到外部数据源的协议...\n\n**完整内容：**\n模型上下文协议（MCP）使 AI 助手能够连接到外部数据源和工具...\n\n---\n"
    }
  ]
}
```

### get-web-search-summaries 响应
```json
{
  "content": [
    {
      "type": "text",
      "text": ""machine learning tutorials"的搜索摘要，共 3 个结果：\n\n**1. 机器学习速成课程**\nURL: https://developers.google.com/machine-learning/crash-course\n描述：Google 的快节奏、实用的机器学习入门...\n\n---\n\n**2. 机器学习简介**\nURL: https://www.coursera.org/learn/machine-learning\n描述：学习最有效的机器学习技术...\n\n---\n"
    }
  ]
}
```

### get-single-web-page-content 响应
```json
{
  "content": [
    {
      "type": "text",
      "text": "**页面内容来自：https://example.com/article**\n\n**标题：** example.com/article\n**字数：** 1250\n**内容长度：** 8500 个字符\n\n**内容：**\n这是从网页提取的内容...\n[完整页面内容继续]"
    }
  ]
}
```

## 错误处理

### 常见错误类型

1. **网络错误**
   - 超时错误
   - 连接被拒绝
   - DNS 解析失败

2. **搜索错误**
   - 无效的搜索查询
   - Google 速率限制
   - CAPTCHA 挑战

3. **内容提取错误**
   - 页面访问被拒绝（403、404）
   - 内容编码问题
   - 格式错误的 HTML

### 错误响应格式
```json
{
  "error": {
    "message": "错误描述",
    "type": "error_type",
    "details": "附加错误信息"
  }
}
```

## 速率限制

服务器实施速率限制以遵守 Google 的服务条款：

- 每分钟最多 10 个请求
- 最多 5 个并发内容提取
- 自动重试，采用指数退避

## 性能考虑

### 响应时间
- 搜索执行：1-5 秒
- 内容提取：每个 URL 2-10 秒
- 总响应时间：3-15 秒（取决于结果数量）

### 内容限制
- 最大内容长度：每页 50KB
- 最大并发请求：5
- 请求超时：10 秒

## 集成示例

### LM Studio 配置
```json
{
  "mcpServers": {
    "web-search": {
      "command": "web-search-mcp",
      "args": [],
      "env": {
        "GOOGLE_SEARCH_TIMEOUT": "15000",
        "MAX_CONTENT_LENGTH": "75000"
      }
    }
  }
}
```

### Claude Desktop 配置
```json
{
  "mcpServers": {
    "web-search": {
      "command": "/usr/local/bin/web-search-mcp",
      "args": []
    }
  }
}
```

## 最佳实践

### 查询优化
- 使用具体、描述性的查询
- 包含相关关键词
- 避免过于宽泛的搜索

### 结果处理
- 检查内容提取错误
- 优雅地处理部分失败
- 考虑结果相关性

### 错误恢复
- 为临时错误实施重试逻辑
- 当提取失败时提供备用内容
- 记录错误以进行调试

## 故障排除

### 常见问题

1. **未返回结果**
   - 检查查询有效性
   - 验证网络连接
   - 检查速率限制

2. **内容提取失败**
   - 验证 URL 可访问性
   - 检查内容编码
   - 查看错误消息

3. **性能问题**
   - 减少并发请求
   - 增加超时值
   - 检查系统资源

### 调试模式
通过设置环境变量启用调试日志记录：
```bash
export DEBUG=web-search-mcp:*
```

## 支持

如有问题和疑问，请在 GitHub 上提交 issue。
