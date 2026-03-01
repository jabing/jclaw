declare module 'memsearch-core' {
  export class MemSearch {
    constructor(config: {
      paths: string[];
      embedding: {
        provider: string;
        model: string;
      };
      milvus?: {
        uri?: string;
        collection?: string;
      };
    });

    index(): Promise<void>;
    search(
      query: string,
      options?: { top_k?: number }
    ): Promise<
      Array<{
        content: string;
        score: number;
        source?: string;
      }>
    >;

    addText(text: string, metadata?: Record<string, unknown>): Promise<string>;
    delete(id: string): Promise<void>;
  }
}
