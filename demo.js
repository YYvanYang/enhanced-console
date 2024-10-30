// demo.js

import AsyncConsoleEnhancer from './enhanced-console.js';

// 开发环境配置示例
const devEnhancer = new AsyncConsoleEnhancer({
  batchSize: 1,              // 立即处理
  flushInterval: 100,        // 快速刷新
  sourceMapEnabled: true,    // 启用 source map
  useCache: true,           // 使用缓存
  maxQueueSize: 100         // 较小的队列
});

// 生产环境配置示例
const prodEnhancer = new AsyncConsoleEnhancer({
  batchSize: 10,            // 批量处理
  flushInterval: 1000,      // 较长刷新间隔
  sourceMapEnabled: false,  // 禁用 source map
  useCache: false,         // 禁用缓存
  maxQueueSize: 1000       // 较大的队列
});

// 基本使用示例
const cleanup = devEnhancer.enhance();

console.log('Hello World');
console.warn('Warning message');
console.error('Error occurred', { code: 500 });
console.info('Info message');
console.debug('Debug info');

// 对象和错误示例
const obj = { name: 'test', value: 42 };
console.log('Object:', obj);

try {
  throw new Error('Test error');
} catch (err) {
  console.error('Caught error:', err);
}

// 性能测试示例
async function performanceTest() {
  console.time('logging');

  const promises = Array(1000).fill(null).map((_, i) =>
    new Promise(resolve => {
      setTimeout(() => {
        console.log(`Log message ${i}`);
        resolve();
      }, Math.random() * 1000);
    })
  );

  await Promise.all(promises);
  console.timeEnd('logging');
}

// 清理示例
async function shutdown() {
  await cleanup();
  console.log('Console enhancement cleaned up');
}

// 使用示例
(async () => {
  try {
    await performanceTest();
  } finally {
    await shutdown();
  }
})();
