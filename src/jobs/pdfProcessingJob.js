const { Worker } = require('bullmq');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const fs = require('fs').promises;
const path = require('path');
const vectorService = require('../services/vectorService');
const logger = require('../utils/logger');

class PDFProcessingJob {
    constructor() {
        this.worker = new Worker(
            'file-upload-queue',
            this.processPDF.bind(this),
            {
                connection: {
                    host: process.env.BULLMQ_HOST,
                    port: process.env.BULLMQ_PORT
                }
            }
        );

        this.setupEventHandlers();
    }

    async processPDF(job) {
        try {
            logger.info('Starting PDF processing job', { jobId: job.id });
            
            const data = JSON.parse(job.data);
            logger.info('Processing PDF file', { 
                jobId: job.id, 
                filename: data.filename,
                path: data.path 
            });

            // Load the PDF
            const loader = new PDFLoader(data.path);
            const docs = await loader.load();
            
            logger.info('PDF loaded successfully', { 
                jobId: job.id, 
                documentCount: docs.length 
            });

            // Add documents to vector store
            await vectorService.addDocuments(docs);
            
            // Remove the processed file
            try {
                await fs.unlink(data.path);
                logger.info('PDF file removed successfully', { 
                    jobId: job.id, 
                    filename: data.filename,
                    path: data.path 
                });
            } catch (removeError) {
                logger.warn('Failed to remove PDF file after processing', { 
                    jobId: job.id, 
                    filename: data.filename,
                    path: data.path,
                    error: removeError.message 
                });
                // Don't throw error here as processing was successful
            }
            
            logger.info('PDF processing completed successfully', { 
                jobId: job.id, 
                filename: data.filename 
            });

            return { success: true, documentCount: docs.length };
        } catch (error) {
            logger.error('PDF processing failed', { 
                jobId: job.id, 
                error: error.message 
            });
            throw error;
        }
    }

    setupEventHandlers() {
        this.worker.on('completed', (job, result) => {
            logger.info('Job completed', { 
                jobId: job.id, 
                result 
            });
        });

        this.worker.on('failed', (job, error) => {
            logger.error('Job failed', { 
                jobId: job.id, 
                error: error.message 
            });
        });

        this.worker.on('error', (error) => {
            logger.error('Worker error', { error: error.message });
        });
    }

    start() {
        logger.info('PDF processing worker started');
    }

    stop() {
        return this.worker.close();
    }
}

module.exports = PDFProcessingJob;
