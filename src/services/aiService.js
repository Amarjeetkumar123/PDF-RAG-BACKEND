const { AzureChatOpenAI } = require("@langchain/openai");
const logger = require('../utils/logger');

class AIService {
    constructor() {
        this.llm = new AzureChatOpenAI({
            model: "gpt-4o",
            temperature: 0,
            maxRetries: 2,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
            azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
            azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        });
    }

    async generateResponse(userQuery, context) {
        try {
            const SYSTEM_PROMPT = `
            You are a helpful AI assistant who answers the user query based on the available context from PDF File.
            Context:
            ${JSON.stringify(context)}
            `;

            const response = await this.llm.invoke([
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userQuery }
            ]);

            logger.info('AI response generated', { 
                query: userQuery, 
                contextLength: context.length 
            });

            return response.content;
        } catch (error) {
            logger.error('Failed to generate AI response', { 
                error: error.message, 
                query: userQuery 
            });
            throw error;
        }
    }
}

module.exports = new AIService();
