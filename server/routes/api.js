const express = require("express");
const router = express.Router();
const path = require("path");
const translationController = require("../controllers/translationController");

// Định nghĩa routes

// POST /api/translate
router.post("/translate", translationController.translate);

// GET /api/health
router.get("/health", (req, res) => {
    // Trả về file health.html ở root project
    res.sendFile(path.join(__dirname, '..', '..', 'health.html'));
});

module.exports = router;
