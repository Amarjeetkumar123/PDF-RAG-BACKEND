const { QdrantVectorStore } = require("@langchain/qdrant");
const { AzureOpenAIEmbeddings } = require("@langchain/openai");
const logger = require('../utils/logger');

class VectorService {
    constructor() {
        this.embeddings = new AzureOpenAIEmbeddings({
            azureOpenAIApiKey: process.env.AZURE_OPENAI_EMBEDDINGS_API_KEY,
            azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_EMBEDDINGS_INSTANCE_NAME,
            azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION,
            maxRetries: 1,
        });
    }

    async getVectorStore() {
        try {
            return await QdrantVectorStore.fromExistingCollection(this.embeddings, {
                url: process.env.QDRANT_URL,
                collectionName: process.env.QDRANT_COLLECTION,
            });
        } catch (error) {
            logger.error('Failed to get vector store', { error: error.message });
            throw error;
        }
    }

    async addDocuments(documents) {
        try {
            const vectorStore = await this.getVectorStore();
            await vectorStore.addDocuments(documents);
            logger.info('Documents added to vector store', { count: documents.length });
        } catch (error) {
            logger.error('Failed to add documents to vector store', { error: error.message });
            throw error;
        }
    }

    async searchSimilar(query, k = 2) {
        try {
            const vectorStore = await this.getVectorStore();
            const retriever = vectorStore.asRetriever({ k });
            const results = await retriever.invoke(query);
            logger.info('Vector search completed', { query, resultsCount: results.length });
            return results;
        } catch (error) {
            logger.error('Failed to search similar documents', { error: error.message, query });
            throw error;
        }
    }
}

module.exports = new VectorService();
