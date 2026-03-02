import express from "express";
import { generateQuestion, evaluateAnswer, analyzeResume } from "../controllers/interviewController.js";

const router = express.Router();

// Health check endpoint
router.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

router.post("/generate-question", generateQuestion);
router.post("/evaluate-answer", evaluateAnswer);
router.post("/analyze-resume", analyzeResume);

export default router;