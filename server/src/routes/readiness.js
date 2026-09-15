const express = require("express");
const { analyzeCandidateReadiness } = require("../controllers/readinesscontroller.js");
const { optionalProtect } = require("../middleware/optionalAuth.js");

const router = express.Router();

// POST /api/readiness/analyze
router.post("/analyze", optionalProtect, analyzeCandidateReadiness);

module.exports = router;
