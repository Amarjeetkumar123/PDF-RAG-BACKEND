require('dotenv').config();

const express = require('express');
const cors = require('cors');
const logger = require('./src/utils/logger');
const PDFProcessingJob = require('./src/jobs/pdfProcessingJob');

// Import routers
const uploadRouter = require('./src/routers/uploadRouter');
const chatRouter = require('./src/routers/chatRouter');

class Application {
    constructor() {
        this.app = express();
        this.server = null;
        this.pdfWorker = null;
        this.port = process.env.PORT || 8000;
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/', (req, res) => {
            res.json({ 
                message: 'PDF RAG Server is running',
                status: 'healthy',
                timestamp: new Date().toISOString()
            });
        });

        // API routes
        this.app.use('/upload', uploadRouter);
        this.app.use('/chat', chatRouter);
    }

    async startWorker() {
        try {
            this.pdfWorker = new PDFProcessingJob();
            this.pdfWorker.start();
            logger.info('PDF processing worker started');
        } catch (error) {
            logger.error('Failed to start PDF worker', { error: error.message });
            throw error;
        }
    }

    async startServer() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, (error) => {
                if (error) {
                    logger.error('Failed to start server', { error: error.message });
                    reject(error);
                } else {
                    logger.info('Server started successfully', { 
                        port: this.port,
                        environment: process.env.NODE_ENV || 'development'
                    });
                    resolve();
                }
            });
        });
    }

    async start() {
        try {
            logger.info('Starting PDF RAG application...');
            
            this.setupMiddleware();
            this.setupRoutes();
            
            // Start both server and worker
            await Promise.all([
                this.startServer(),
                this.startWorker()
            ]);

            logger.info('Application started successfully');
        } catch (error) {
            logger.error('Failed to start application', { error: error.message });
            await this.shutdown();
            process.exit(1);
        }
    }

    async shutdown() {
        logger.info('Shutting down application...');
        
        try {
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
                logger.info('Server stopped');
            }

            if (this.pdfWorker) {
                await this.pdfWorker.stop();
                logger.info('PDF worker stopped');
            }

            logger.info('Application shutdown complete');
        } catch (error) {
            logger.error('Error during shutdown', { error: error.message });
        }
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await app.shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await app.shutdown();
    process.exit(0);
});

// Start the application
const app = new Application();
app.start().catch((error) => {
    logger.error('Application failed to start', { error: error.message });
    process.exit(1);
});

module.exports = app;
