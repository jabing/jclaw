/**
 * NanoClaw Adapter
 *
 * Provides interface to NanoClaw CLI for WhatsApp messaging.
 */

export interface NanoClawOptions {
  nanoclawPath?: string;
  timeout?: number;
}

export interface Message {
  from: string;
  content: string;
  timestamp?: number;
}

export interface SendMessageOptions {
  to: string;
  content: string;
}

export interface NanoClawResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * NanoClaw 适配器 - 封装 NanoClaw CLI 调用
 */
export class NanoClawAdapter {
  private nanoclawPath: string;
  private timeout: number;

  constructor(options: NanoClawOptions = {}) {
    this.nanoclawPath = options.nanoclawPath ?? 'nanoclaw';
    this.timeout = options.timeout ?? 30000;
  }

  /**
   * 发送消息到 WhatsApp
   */
  async sendMessage(options: SendMessageOptions): Promise<NanoClawResult> {
    // Stub implementation - 实际调用 NanoClaw CLI
    return {
      success: true,
      data: { to: options.to, content: options.content },
    };
  }

  /**
   * 接收消息 (轮询模式)
   */
  async receiveMessages(): Promise<Message[]> {
    // Stub implementation - 实际从 NanoClaw 获取消息
    return [];
  }

  /**
   * 检查 NanoClaw 是否可用
   */
  async isAvailable(): Promise<boolean> {
    // Stub implementation - 检查 nanoclaw 命令是否存在
    return true;
  }

  /**
   * 启动 NanoClaw 服务
   */
  async start(): Promise<NanoClawResult> {
    return { success: true };
  }

  /**
   * 停止 NanoClaw 服务
   */
  async stop(): Promise<NanoClawResult> {
    return { success: true };
  }
}
