const express = require('express');
const multer = require('multer');
const queueService = require('../services/queueService');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `${uniqueSuffix}-${file.originalname}`)
    }
});

const upload = multer({ storage: storage });

router.post('/pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded' 
            });
        }

        const fileData = {
            filename: req.file.filename,
            destination: req.file.destination,
            path: req.file.path
        };

        await queueService.addFileProcessingJob(fileData);

        logger.info('PDF upload successful', { 
            filename: req.file.filename,
            originalName: req.file.originalname 
        });

        res.json({ 
            message: 'File uploaded successfully',
            filename: req.file.filename 
        });
    } catch (error) {
        logger.error('PDF upload failed', { 
            error: error.message 
        });
        res.status(500).json({ 
            error: 'Failed to upload file' 
        });
    }
});

module.exports = router;
