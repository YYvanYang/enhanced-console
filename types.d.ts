// types.d.ts

declare module 'enhanced-console' {
  export interface ConsoleEnhancerOptions {
    /** 每批处理的日志数量 */
    batchSize?: number;
    /** 强制刷新间隔(ms) */
    flushInterval?: number;
    /** 队列最大长度 */
    maxQueueSize?: number;
    /** 是否启用 source map */
    sourceMapEnabled?: boolean;
    /** 是否使用 Cache API 缓存 */
    useCache?: boolean;
    /** Cache API 的键名 */
    cacheKey?: string;
    /** requestIdleCallback 超时时间 */
    idleTimeout?: number;
  }

  export default class AsyncConsoleEnhancer {
    constructor(options?: ConsoleEnhancerOptions);
    enhance(): () => Promise<void>;
    cleanup(): Promise<void>;
  }
}
