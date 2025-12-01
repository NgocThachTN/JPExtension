// Vercel Serverless Function - Health Check API
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Trả về file health.html
    try {
        const htmlPath = path.join(__dirname, '..', 'health.html');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(htmlContent);
    } catch (error) {
        // Fallback to JSON if HTML file not found
        return res.json({
            status: "ok",
            message: "Japanese-Vietnamese Translator API is running!",
            timestamp: new Date().toISOString(),
            endpoints: {
                translate: "POST /api/translate",
                health: "GET /api/health"
            }
        });
    }
};
