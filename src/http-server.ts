#!/usr/bin/env node
console.log('Web Search MCP HTTP Server starting...');

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { WebSearchMCPServer } from './index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

// 环境变量配置
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const API_KEY = process.env.API_KEY;
const ENABLE_CORS = process.env.ENABLE_CORS !== 'false';

// 验证必需的环境变量
if (!API_KEY) {
  console.error('错误: 未设置 API_KEY 环境变量');
  console.error('请在启动前设置 API_KEY，例如: API_KEY=your-secret-key pnpm start:http');
  process.exit(1);
}

// 创建 Express 应用
const app = express();

// 中间件配置
app.use(express.json());

// CORS 配置
if (ENABLE_CORS) {
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  }));
  console.log('CORS 已启用');
}

// API Key 认证中间件
function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  // 健康检查端点不需要认证
  if (req.path === '/health') {
    next();
    return;
  }

  // 从 Header 中获取 API Key
  const apiKey = req.headers['x-api-key'] || 
                 (req.headers['authorization']?.startsWith('Bearer ') 
                   ? req.headers['authorization'].substring(7) 
                   : null);

  if (!apiKey) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: '缺少 API Key。请在 X-API-Key header 或 Authorization: Bearer <key> header 中提供 API Key。' 
    });
    return;
  }

  if (apiKey !== API_KEY) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'API Key 无效' 
    });
    return;
  }

  next();
}

// 应用认证中间件
app.use(apiKeyAuth);

// 健康检查端点
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'web-search-mcp-http',
    version: '0.3.1',
    timestamp: new Date().toISOString(),
  });
});

// MCP over SSE 端点
app.get('/sse', async (req: Request, res: Response) => {
  console.log('[HTTP] 新的 SSE 连接请求');
  
  try {
    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 创建 MCP 服务器实例
    const mcpServer = new WebSearchMCPServer();
    const server = mcpServer.getServer();
    
    // 创建 SSE 传输
    const transport = new SSEServerTransport('/message', res);
    
    // 连接 MCP 服务器到传输层
    await server.connect(transport);
    
    console.log('[HTTP] SSE 连接已建立');
    
    // 处理客户端断开连接
    req.on('close', () => {
      console.log('[HTTP] SSE 连接已关闭');
      transport.close();
    });
    
  } catch (error) {
    console.error('[HTTP] SSE 连接错误:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
});

// POST 端点用于 SSE 消息传递
app.post('/message', async (req: Request, res: Response) => {
  console.log('[HTTP] 收到 SSE 消息:', req.body);
  
  try {
    // SSE 传输会处理这个请求
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[HTTP] 消息处理错误:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// 根路径 - 提供基本信息
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Web Search MCP HTTP Server',
    version: '0.3.1',
    description: '基于 MCP 协议的网页搜索服务，支持 SSE 传输',
    endpoints: {
      health: 'GET /health - 健康检查',
      sse: 'GET /sse - MCP over SSE 连接端点（需要 API Key）',
      message: 'POST /message - SSE 消息端点（需要 API Key）',
    },
    authentication: {
      type: 'API Key',
      headers: [
        'X-API-Key: <your-api-key>',
        'Authorization: Bearer <your-api-key>',
      ],
    },
    documentation: 'https://github.com/mrkrsl/web-search-mcp',
  });
});

// 错误处理中间件
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[HTTP] 错误:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

// 404 处理
app.use((_req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: '端点不存在' 
  });
});

// 启动服务器
app.listen(HTTP_PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🚀 Web Search MCP HTTP Server 已启动');
  console.log(`${'='.repeat(60)}`);
  console.log(`📡 监听端口: ${HTTP_PORT}`);
  console.log(`🔒 API Key 认证: 已启用`);
  console.log(`🌐 CORS: ${ENABLE_CORS ? '已启用' : '已禁用'}`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}`);
  console.log('\n可用端点:');
  console.log(`  - GET  http://localhost:${HTTP_PORT}/health   (健康检查)`);
  console.log(`  - GET  http://localhost:${HTTP_PORT}/sse      (MCP SSE 连接)`);
  console.log(`  - POST http://localhost:${HTTP_PORT}/message  (SSE 消息)`);
  console.log(`\n💡 提示: 使用 X-API-Key header 进行认证`);
  console.log(`${'='.repeat(60)}\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在优雅关闭服务器...');
  process.exit(0);
});

