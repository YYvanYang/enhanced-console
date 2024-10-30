# Enhanced Console Logger

[![npm version](https://img.shields.io/npm/v/enhanced-console.svg)](https://www.npmjs.com/package/enhanced-console)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个高性能的控制台日志增强工具，支持源码映射和异步处理。它能够帮助你在压缩代码中准确定位日志的来源位置，同时通过异步批处理机制最小化性能影响。

## 特性

- 🚀 异步处理，最小化性能影响
- 📍 精确定位源码位置（支持压缩代码）
- 🎯 Source Map 支持
- 💾 智能缓存机制
- ⚡ 批量处理优化
- 🔄 优雅降级机制
- 📦 TypeScript 支持

## 安装

```bash
npm install enhanced-console

# 或者使用 yarn
yarn add enhanced-console

# 或者使用 pnpm
pnpm add enhanced-console
```

## 快速开始

### 基础使用

```javascript
import AsyncConsoleEnhancer from 'enhanced-console';

// 创建增强器实例
const enhancer = new AsyncConsoleEnhancer();

// 启用增强
const cleanup = enhancer.enhance();

// 使用增强后的 console
console.log('Hello World');  // 将显示源码位置
console.warn('Warning message');
console.error('Error occurred');

// 清理（在应用关闭时）
await cleanup();
```

### 开发环境配置

```javascript
const enhancer = new AsyncConsoleEnhancer({
  batchSize: 1,              // 立即处理
  flushInterval: 100,        // 快速刷新
  sourceMapEnabled: true,    // 启用 source map
  useCache: true            // 使用缓存
});
```

### 生产环境配置

```javascript
const enhancer = new AsyncConsoleEnhancer({
  batchSize: 10,            // 批量处理
  flushInterval: 1000,      // 较长刷新间隔
  sourceMapEnabled: false,  // 禁用 source map
  useCache: false          // 禁用缓存
});
```

## API 文档

### AsyncConsoleEnhancer

主类，用于创建和管理增强的控制台功能。

#### 构造函数选项

```typescript
interface ConsoleEnhancerOptions {
  batchSize?: number;        // 每批处理的日志数量（默认：10）
  flushInterval?: number;    // 强制刷新间隔(ms)（默认：1000）
  maxQueueSize?: number;     // 队列最大长度（默认：1000）
  sourceMapEnabled?: boolean;// 是否启用 source map（默认：true）
  useCache?: boolean;        // 是否使用 Cache API 缓存（默认：true）
  cacheKey?: string;        // Cache API 的键名（默认：'source-map-cache'）
  idleTimeout?: number;     // requestIdleCallback 超时时间（默认：1000）
}
```

#### 方法

##### enhance(): () => Promise<void>

启用控制台增强功能。返回一个清理函数。

```javascript
const cleanup = enhancer.enhance();
```

##### cleanup(): Promise<void>

清理所有资源，恢复原始控制台功能。

```javascript
await enhancer.cleanup();
```

## 高级使用

### 处理大量日志

```javascript
const enhancer = new AsyncConsoleEnhancer({
  batchSize: 50,            // 增大批处理数量
  maxQueueSize: 5000,       // 增大队列容量
  flushInterval: 2000       // 增加刷新间隔
});
```

### 自定义缓存配置

```javascript
const enhancer = new AsyncConsoleEnhancer({
  useCache: true,
  cacheKey: 'my-app-source-maps'  // 自定义缓存键名
});
```

### 错误处理

```javascript
try {
  throw new Error('Test error');
} catch (err) {
  console.error('Error occurred:', err);  // 将显示完整的错误堆栈和源码位置
}
```

## 浏览器支持

- Chrome 61+
- Firefox 55+
- Safari 11+
- Edge 79+

需要以下 API 支持：
- Source Map API
- Cache API (可选)
- requestIdleCallback (有降级方案)

## 性能考虑

1. CPU 影响
   - 使用异步处理避免阻塞主线程
   - 批量处理减少 Source Map 查询
   - 利用浏览器空闲时间处理日志

2. 内存使用
   - 队列大小限制
   - Source Map 缓存管理
   - 及时清理机制

3. 网络影响
   - Source Map 缓存
   - 按需加载
   - 批量处理

## 调试提示

如果你在使用时遇到问题，可以：

1. 检查 Source Map 是否正确生成
```javascript
// 临时禁用 source map
const enhancer = new AsyncConsoleEnhancer({ sourceMapEnabled: false });
```

2. 监控队列状态
```javascript
setInterval(() => {
  console.log('Queue size:', enhancer.logQueue.length);
}, 1000);
```

## 贡献指南

欢迎提交 Pull Request！请确保：

1. 添加测试用例
2. 更新文档
3. 遵循现有的代码风格
4. 添加必要的注释

## 灵感来源

本项目受到 [Remy Sharp's blog post](https://remysharp.com/2014/05/23/where-is-that-console-log) 的启发，并在此基础上进行了大量优化和改进。

## 许可证

MIT © [Your Name]

## 更新日志

### 1.0.0
- 初始发布
- 基本功能实现
- Source Map 支持
- 异步处理优化

### 1.1.0
- 添加 TypeScript 支持
- 改进错误处理
- 添加缓存机制
- 性能优化

## 相关项目

- [source-map](https://github.com/mozilla/source-map) - Source Map 解析库
- [console-probe](https://github.com/node-modules/console-probe) - Node.js 控制台增强
