const { Queue } = require('bullmq');
const logger = require('../utils/logger');

class QueueService {
    constructor() {
        this.queue = new Queue('file-upload-queue', {
            connection: {
                host: process.env.BULLMQ_HOST,
                port: process.env.BULLMQ_PORT
            }
        });
    }

    async addFileProcessingJob(fileData) {
        try {
            const job = await this.queue.add('file-ready', JSON.stringify(fileData));
            logger.info('File processing job added to queue', { 
                jobId: job.id, 
                filename: fileData.filename 
            });
            return job;
        } catch (error) {
            logger.error('Failed to add file processing job', { 
                error: error.message, 
                filename: fileData.filename 
            });
            throw error;
        }
    }

    getQueue() {
        return this.queue;
    }
}

module.exports = new QueueService();
