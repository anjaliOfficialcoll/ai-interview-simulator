import { generateQuestionFromAI, evaluateAnswerFromAI, analyzeResumeFromAI } from "../services/geminiService.js";
import { getFallbackQuestion } from "../utils/fallbackQuestions.js";
import { getFallbackFeedback } from "../utils/fallbackFeedback.js";
import { getFallbackResumeFeedback } from "../utils/fallbackResumeFeedback.js";

export async function generateQuestion(req, res) {
  const { role, difficulty } = req.body;

  if (!role || !difficulty) {
    return res.status(400).json({ error: "Role and difficulty required" });
  }

  const prompt = `
  Generate one ${difficulty} level interview question 
  for a ${role}. Only return the question.
  `;

  try {
    const question = await generateQuestionFromAI(prompt);

    if (!question || !question.trim()) {
      console.warn("⚠️  Empty response from Gemini API, using fallback");
      const fallback = getFallbackQuestion(role, difficulty);
      return res.json({ question: fallback, source: "fallback" });
    }

    console.log("✅ Generated question via Gemini API");
    res.json({ question: question.trim(), source: "ai" });
  } catch (error) {
    console.error("❌ AI failed with error:", error.message);
    console.warn("⚠️  Using fallback question instead");
    const fallback = getFallbackQuestion(role, difficulty);
    res.json({ question: fallback, source: "fallback" });
  }
}

export async function evaluateAnswer(req, res) {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const prompt = `
  Question: ${question}
  Answer: ${answer}
  
  Evaluate this answer and give feedback with a score out of 10.
  `;

  try {
    const feedback = await evaluateAnswerFromAI(prompt);

    if (!feedback || !feedback.trim()) {
      console.warn("⚠️  Empty response from Gemini API, using fallback");
      const fallback = getFallbackFeedback(question, answer);
      return res.json({ feedback: fallback, source: "fallback" });
    }

    console.log("✅ Generated feedback via Gemini API");
    res.json({ feedback: feedback.trim(), source: "ai" });
  } catch (error) {
    console.error("❌ Evaluation error:", error.message);
    console.warn("⚠️  Using fallback feedback instead");
    const fallback = getFallbackFeedback(question, answer);
    res.json({ feedback: fallback, source: "fallback" });
  }
}

export async function analyzeResume(req, res) {
  const { resumeBase64, mimeType, fileName } = req.body;

  if (!resumeBase64) {
    return res.status(400).json({ error: "resumeBase64 is required" });
  }

  try {
    const analysis = await analyzeResumeFromAI({
      resumeBase64,
      mimeType: mimeType || "application/pdf",
      fileName: fileName || "resume.pdf",
    });

    if (!analysis || !analysis.trim()) {
      console.warn("⚠️  Empty response from Gemini API, using fallback");
      const fallback = getFallbackResumeFeedback(fileName || "resume.pdf");
      return res.json({ analysis: fallback, source: "fallback" });
    }

    console.log("✅ Analyzed resume via Gemini API");
    return res.json({ analysis: analysis.trim(), source: "ai" });
  } catch (error) {
    console.error("❌ Resume analysis error:", error.message);
    console.warn("⚠️  Using fallback resume feedback instead");
    const fallback = getFallbackResumeFeedback(fileName || "resume.pdf");
    return res.json({ analysis: fallback, source: "fallback" });
  }
}