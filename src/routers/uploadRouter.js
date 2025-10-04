const express = require('express');
const multer = require('multer');
const queueService = require('../services/queueService');
const vectorService = require('../services/vectorService');
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

        res.status(200).json({ 
            message: 'File uploaded successfully',
            filename: req.file.filename,
            filePath: req.file.path
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

// DELETE route to remove documents by source
router.delete('/pdf/:source', async (req, res) => {
    try {
        const { source } = req.params;
        
        if (!source) {
            return res.status(400).json({ 
                error: 'Source parameter is required' 
            });
        }

        await vectorService.deleteDocumentsBySource(source);

        logger.info('Documents deleted by source', { source });

        res.json({ 
            message: 'Documents deleted successfully',
            source: source 
        });
    } catch (error) {
        logger.error('Failed to delete documents by source', { 
            error: error.message,
            source: req.params.source 
        });
        res.status(500).json({ 
            error: 'Failed to delete documents' 
        });
    }
});

module.exports = router;
