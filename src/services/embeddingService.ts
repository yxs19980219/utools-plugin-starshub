import type { EmbeddingConfig } from '../types';

/**
 * Embedding 服务 -- 封装 preload 的 embedding API 调用
 */

export const embeddingService = {
    /**
     * 获取文本向量
     */
    async getEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
        return window.githubStarsAPI.getEmbedding(text, config);
    },

    /**
     * 测试连接
     */
    async testConnection(config: EmbeddingConfig): Promise<{ success: boolean; dimensions: number; error?: string }> {
        return window.githubStarsAPI.testEmbeddingConnection(config);
    },
};
