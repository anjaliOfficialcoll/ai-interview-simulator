import express from "express";
import { generateQuestion, evaluateAnswer, analyzeResume, getHint } from "../controllers/interviewController.js";
import { generateQuestionFromAI } from "../services/geminiService.js";

const router = express.Router();

// Health check endpoint
router.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

// Gemini API test endpoint - check if API connection works
router.get("/test-gemini", async (req, res) => {
  try {
    console.log("🧪 Testing Gemini API connection...");
    const testPrompt = "Say 'Gemini API is working!' and nothing else.";
    const response = await generateQuestionFromAI(testPrompt);
    
    console.log("✅ Gemini API test successful");
    res.json({
      status: "success",
      message: "✅ Gemini API is connected and working",
      response: response
    });
  } catch (error) {
    console.error("❌ Gemini API test failed:", error.message);
    res.status(500).json({
      status: "error",
      message: "❌ Gemini API test failed",
      error: error.message
    });
  }
});

router.post("/generate-question", generateQuestion);
router.post("/evaluate-answer", evaluateAnswer);
router.post("/analyze-resume", analyzeResume);
router.post("/get-hint", getHint);

export default router;