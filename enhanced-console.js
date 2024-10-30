// enhanced-console.js

/**
 * 增强的控制台日志系统
 * @typedef {Object} ConsoleEnhancerOptions
 * @property {number} [batchSize=10] - 每批处理的日志数量
 * @property {number} [flushInterval=1000] - 强制刷新间隔(ms)
 * @property {number} [maxQueueSize=1000] - 队列最大长度
 * @property {boolean} [sourceMapEnabled=true] - 是否启用 source map
 * @property {boolean} [useCache=true] - 是否使用 Cache API 缓存
 * @property {string} [cacheKey='source-map-cache'] - Cache API 的键名
 * @property {number} [idleTimeout=1000] - requestIdleCallback 超时时间
 */

class AsyncConsoleEnhancer {
  /**
   * @param {ConsoleEnhancerOptions} options
   */
  constructor(options = {}) {
    this.sourceMapCache = new Map();
    this.logQueue = [];
    this.isProcessing = false;
    this.options = {
      batchSize: options.batchSize ?? 10,
      flushInterval: options.flushInterval ?? 1000,
      maxQueueSize: options.maxQueueSize ?? 1000,
      sourceMapEnabled: options.sourceMapEnabled ?? true,
      useCache: options.useCache ?? true,
      cacheKey: options.cacheKey ?? 'source-map-cache',
      idleTimeout: options.idleTimeout ?? 1000
    };

    this.originalMethods = new Map();
    this.pendingSourceMaps = new Map();
  }

  /**
   * 从缓存或网络加载 Source Map
   * @param {string} fileUrl - 源文件URL
   * @returns {Promise<SourceMapConsumer|null>}
   */
  async loadSourceMap(fileUrl) {
    // 检查内存缓存
    if (this.sourceMapCache.has(fileUrl)) {
      return this.sourceMapCache.get(fileUrl);
    }

    // 检查正在进行的加载
    if (this.pendingSourceMaps.has(fileUrl)) {
      return this.pendingSourceMaps.get(fileUrl);
    }

    const loadPromise = (async () => {
      try {
        // 尝试从 Cache API 加载
        if (this.options.useCache && 'caches' in window) {
          const cache = await caches.open(this.options.cacheKey);
          const response = await cache.match(fileUrl + '.map');
          if (response) {
            const sourceMap = await response.json();
            const consumer = await new sourceMap.SourceMapConsumer(sourceMap);
            this.sourceMapCache.set(fileUrl, consumer);
            return consumer;
          }
        }

        // 从网络加载
        const response = await fetch(`${fileUrl}.map`);
        if (!response.ok) {
          throw new Error(`Failed to load source map: ${response.statusText}`);
        }

        const sourceMap = await response.json();
        const consumer = await new sourceMap.SourceMapConsumer(sourceMap);
        this.sourceMapCache.set(fileUrl, consumer);

        // 缓存到 Cache API
        if (this.options.useCache && 'caches' in window) {
          const cache = await caches.open(this.options.cacheKey);
          await cache.put(
            fileUrl + '.map',
            new Response(JSON.stringify(sourceMap))
          );
        }

        return consumer;
      } catch (err) {
        console.error('Error loading source map:', err);
        return null;
      } finally {
        this.pendingSourceMaps.delete(fileUrl);
      }
    })();

    this.pendingSourceMaps.set(fileUrl, loadPromise);
    return loadPromise;
  }

  /**
   * 获取原始源码位置
   * @param {string} frame - 堆栈帧信息
   * @returns {Promise<string>}
   */
  async getOriginalLocation(frame) {
    if (!this.options.sourceMapEnabled) return frame;

    const match = frame.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
    if (!match) return frame;

    const [, fnName, fileUrl, line, column] = match;
    const consumer = await this.loadSourceMap(fileUrl);
    if (!consumer) return frame;

    const original = consumer.originalPositionFor({
      line: parseInt(line, 10),
      column: parseInt(column, 10)
    });

    if (!original.source) return frame;

    return `    at ${original.name || fnName} (${original.source}:${original.line}:${original.column})`;
  }

  /**
   * 处理单个日志条目
   * @param {Object} entry - 日志条目
   * @param {string} entry.method - 日志方法
   * @param {Array} entry.args - 日志参数
   * @param {string} entry.stack - 堆栈信息
   * @returns {Promise<void>}
   */
  async processLogEntry({ method, args, stack }) {
    try {
      const originalLocation = await this.getOriginalLocation(stack);
      const enhancedArgs = [...args];

      // 根据参数类型适当添加位置信息
      const lastArg = args[args.length - 1];
      if (typeof lastArg === 'string') {
        enhancedArgs.push('\n' + originalLocation);
      } else if (typeof lastArg === 'object' && lastArg !== null) {
        enhancedArgs.push({ location: originalLocation });
      } else {
        enhancedArgs.push(originalLocation);
      }

      this.originalMethods.get(method).apply(console, enhancedArgs);
    } catch (err) {
      // 降级到原始日志
      this.originalMethods.get(method).apply(console, args);
    }
  }

  /**
   * 处理日志队列
   * @returns {Promise<void>}
   */
  async processQueue() {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.logQueue.splice(0, this.options.batchSize);

    try {
      await Promise.all(batch.map(entry => this.processLogEntry(entry)));
    } catch (err) {
      console.error('Error processing log queue:', err);
    } finally {
      this.isProcessing = false;
    }

    // 如果队列中还有内容，继续处理
    if (this.logQueue.length > 0) {
      this.scheduleQueueProcessing();
    }
  }

  /**
   * 调度队列处理
   * @private
   */
  scheduleQueueProcessing() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => this.processQueue(),
        { timeout: this.options.idleTimeout }
      );
    } else {
      queueMicrotask(() => this.processQueue());
    }
  }

  /**
   * 设置定期刷新
   * @private
   */
  setupInterval() {
    this.flushInterval = setInterval(() => {
      if (this.logQueue.length > 0) {
        this.processQueue();
      }
    }, this.options.flushInterval);
  }

  /**
   * 增强 console 方法
   * @returns {Function} cleanup - 清理函数
   */
  enhance() {
    ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
      const original = console[method];
      this.originalMethods.set(method, original);

      console[method] = (...args) => {
        try {
          const stack = new Error().stack.split('\n')[2];

          // 如果队列已满，直接使用原始方法
          if (this.logQueue.length >= this.options.maxQueueSize) {
            original.apply(console, [...args, '\n(Queue full - using original console)']);
            return;
          }

          this.logQueue.push({ method, args, stack });
          this.scheduleQueueProcessing();
        } catch (err) {
          // 出错时使用原始方法
          original.apply(console, args);
        }
      };
    });

    this.setupInterval();
    return () => this.cleanup();
  }

  /**
   * 清理资源
   */
  async cleanup() {
    clearInterval(this.flushInterval);

    // 处理剩余的日志
    if (this.logQueue.length > 0) {
      await this.processQueue();
    }

    // 清理 source map 消费者
    for (const consumer of this.sourceMapCache.values()) {
      consumer.destroy();
    }
    this.sourceMapCache.clear();
    this.pendingSourceMaps.clear();

    // 恢复原始控制台方法
    for (const [method, original] of this.originalMethods) {
      console[method] = original;
    }
    this.originalMethods.clear();
  }
}

// 导出模块
export default AsyncConsoleEnhancer;
