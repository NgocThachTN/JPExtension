// Vercel Serverless Function - Health Check API

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.json({
        status: "ok",
        message: "Japanese-Vietnamese Translator API is running!",
        timestamp: new Date().toISOString(),
        endpoints: {
            translate: "POST /api/translate",
            health: "GET /api/health"
        }
    });
};
