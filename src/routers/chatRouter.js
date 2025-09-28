const express = require('express');
const vectorService = require('../services/vectorService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const userQuery = req.query.message;
        
        if (!userQuery) {
            return res.status(400).json({ 
                error: 'Message parameter is required' 
            });
        }

        logger.info('Chat query received', { query: userQuery });

        // Search for similar documents
        const similarDocs = await vectorService.searchSimilar(userQuery);
        
        // Generate AI response
        const aiResponse = await aiService.generateResponse(userQuery, similarDocs);

        logger.info('Chat response generated', { 
            query: userQuery,
            docsFound: similarDocs.length 
        });

        res.json({
            message: aiResponse,
            docs: similarDocs
        });
    } catch (error) {
        logger.error('Chat query failed', { 
            error: error.message,
            query: req.query.message 
        });
        res.status(500).json({ 
            error: 'Failed to process chat query' 
        });
    }
});

module.exports = router;
