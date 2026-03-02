import { generateQuestionFromAI, evaluateAnswerFromAI, analyzeResumeFromAI, generateHintFromAI } from "../services/geminiService.js";
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
    
    // Check if it's an invalid resume error
    if (error.message.includes("does not appear to be a valid resume")) {
      console.warn("⚠️  Invalid resume file uploaded");
      return res.status(400).json({ 
        error: error.message,
        analysis: error.message 
      });
    }
    
    console.warn("⚠️  Using fallback resume feedback instead");
    const fallback = getFallbackResumeFeedback(fileName || "resume.pdf");
    return res.json({ analysis: fallback, source: "fallback" });
  }
}

export async function getHint(req, res) {
  const { question, partialAnswer } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const prompt = `
  Interview Question: ${question}
  ${partialAnswer ? `Current Answer Attempt: ${partialAnswer}` : 'Candidate is unable to answer.'}
  
  Provide a helpful hint to guide the candidate toward the right approach. 
  The hint should:
  - Be encouraging and supportive
  - Give a starting point or framework without revealing the full answer
  - Help them think through the problem
  - Be 2-3 sentences maximum
  
  ${partialAnswer ? 'If their answer is unrelated or off-topic, gently redirect them to the correct approach.' : 'Give them a hint about what topics or concepts to think about.'}
  `;

  try {
    const hint = await generateHintFromAI(prompt);

    if (!hint || !hint.trim()) {
      console.warn("⚠️  Empty response from Gemini API for hint");
      return res.json({ 
        hint: "💡 Think about the key concepts related to this question. Break it down into smaller parts and start with what you know.",
        source: "fallback" 
      });
    }

    console.log("✅ Generated hint via Gemini API");
    res.json({ hint: "💡 " + hint.trim(), source: "ai" });
  } catch (error) {
    console.error("❌ Hint generation error:", error.message);
    res.json({ 
      hint: "💡 Think about the key concepts related to this question. Break it down into smaller parts and start with what you know.",
      source: "fallback" 
    });
  }
}