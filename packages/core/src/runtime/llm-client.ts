/**
 * LLM Client - Support flexible configuration
 */

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}


export interface LLMClientConfig {
  apiBase?: string;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMClient {
  private readonly config: Required<Omit<LLMClientConfig, 'apiBase'>> & {
    apiBase: string;
  };

  constructor(config: LLMClientConfig) {
    this.config = {
      apiBase: config.apiBase || 'https://api.openai.com/v1',
      apiKey: config.apiKey,
      model: config.model || 'gpt-4',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 4096,
    };
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<{ content: string }> {
    try {
      const response = await fetch(`${this.config.apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as OpenAIResponse;
      return { content: data.choices[0]?.message?.content || '' };
    } catch (error) {
      throw new Error(`LLM request failed: ${error}`);
    }
  }
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface LLMResponse {
  content: string;
}

export function createLLMClient(config: LLMClientConfig): LLMClient {
  return new LLMClient(config);
}
