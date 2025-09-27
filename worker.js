const { Worker } = require('bullmq')
const { QdrantVectorStore } = require("@langchain/qdrant");
const { AzureOpenAIEmbeddings } = require("@langchain/openai");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

const worker = new Worker(
    'file-upload-queue',
    async job => {
        console.log(job.data);
        const data = JSON.parse(job.data);
        /*
           Path: data.path
           Read the pdf from path
           Chunk the pdf
           Call openai embedding model for every chunk
           Store the chunks in qdrant vector db
        */

        // load the pdf
        const loader = new PDFLoader(data.path);
        const docs = await loader.load();
        // console.log(docs);

        // call openai embedding model for every chunk

        const embeddings = new AzureOpenAIEmbeddings({
            azureOpenAIApiKey: "feb09a13f8104a24a9cdef0483f27096", // In Node.js defaults to process.env.AZURE_OPENAI_API_KEY
            azureOpenAIApiInstanceName: "shubh-pronnel-eastus2", // In Node.js defaults to process.env.AZURE_OPENAI_API_INSTANCE_NAME
            azureOpenAIApiEmbeddingsDeploymentName: "text-embedding-3-small", // In Node.js defaults to process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME
            azureOpenAIApiVersion: "2023-05-15", // In Node.js defaults to process.env.AZURE_OPENAI_API_VERSION
            maxRetries: 1,
        });

        // Store the chunks in qdrant vector db
        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: "http://localhost:6333",
            collectionName: "pdf-docs",
        });
        await vectorStore.addDocuments(docs);
        console.log("All documents stored in qdrant vector db");
    },
    {
        connection: {
            host: 'localhost',
            port: 6388
        }
    },
);

worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result ${result}`);
});

worker.on('failed', (job, error) => {
    console.log(`Job ${job.id} failed with error ${error}`);
});
