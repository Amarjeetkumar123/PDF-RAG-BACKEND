require('dotenv').config(); // Load environment variables

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const { Queue } = require('bullmq')
const { QdrantVectorStore } = require("@langchain/qdrant");
const { AzureOpenAIEmbeddings } = require("@langchain/openai");
const { AzureChatOpenAI } = require("@langchain/openai");

const app = express()
app.use(cors());

const llm = new AzureChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    maxRetries: 2,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

const queue = new Queue('file-upload-queue', {
    connection: {
        host: process.env.BULLMQ_HOST,
        port: process.env.BULLMQ_PORT
    }
})
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `${uniqueSuffix}-${file.originalname}`)
    }
})
const upload = multer({ storage: storage })

app.get('/', (req, res) => {
    res.json({ message: 'Hello World' })
})


app.post('/upload/pdf', upload.single('pdf'), async (req, res) => {
    const file = req.body.file
    await queue.add('file-ready', JSON.stringify({
        filename: req.file.filename,
        destination: req.file.destination,
        path: req.file.path
    }))
    res.json({ message: 'File uploaded' })
})

app.get('/chat', async (req, res) => {
    const userQuery = req.query.message
    
    const embeddings = new AzureOpenAIEmbeddings({
        azureOpenAIApiKey: process.env.AZURE_OPENAI_EMBEDDINGS_API_KEY,
        azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_EMBEDDINGS_INSTANCE_NAME,
        azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_EMBEDDINGS_API_VERSION,
        maxRetries: 1,
    });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName: process.env.QDRANT_COLLECTION,
    });
    const chain = vectorStore.asRetriever({ k: 2 })
    const result = await chain.invoke(userQuery)

    const SYSTEM_PROMPT = `
    You are a helpful AI assistant who answers the user query based on the available context from PDF File.
    Context:
    ${JSON.stringify(result)}
    `;
    const response = await llm.invoke([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery }
    ])
    res.json({
        message: response.content,
        docs: result
     })
})
app.listen(8000, () => {
    console.log('Server is running on port 8000')
})
