import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables FIRST before reading them
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log("🔑 API Key Status:", apiKey ? "✅ Found" : "❌ NOT FOUND");
if (apiKey) {
  console.log("🔑 API Key (first 20 chars):", apiKey.substring(0, 20) + "...");
}

let genAI;
let model;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });
    console.log("✅ Gemini AI initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Gemini AI:", error.message);
  }
} else {
  console.warn("⚠️  GEMINI_API_KEY not found in environment variables. Using fallback responses only.");
}

export async function generateQuestionFromAI(prompt) {
  if (!model) {
    throw new Error("Gemini API not initialized. Missing GEMINI_API_KEY.");
  }
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("✅ Question generated successfully via Gemini API");
    return response.text();
  } catch (error) {
    console.error("❌ Gemini API error in generateQuestionFromAI:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}

export async function evaluateAnswerFromAI(prompt) {
  if (!model) {
    throw new Error("Gemini API not initialized. Missing GEMINI_API_KEY.");
  }
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("✅ Answer evaluated successfully via Gemini API");
    return response.text();
  } catch (error) {
    console.error("❌ Gemini API error in evaluateAnswerFromAI:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}

export async function analyzeResumeFromAI({ resumeBase64, mimeType = "application/pdf", fileName = "resume.pdf" }) {
  if (!model) {
    throw new Error("Gemini API not initialized. Missing GEMINI_API_KEY.");
  }
  
  const prompt = `
  Analyze this resume and return concise interview preparation guidance in this exact format:
  Score: <number out of 10>
  Suggested Role: <one role>
  Suggested Difficulty: <Easy/Medium/Hard>
  Strengths:
  - <point 1>
  - <point 2>
  Improvements:
  - <point 1>
  - <point 2>
  Focus Topics:
  - <topic 1>
  - <topic 2>
  Summary:
  <2 short lines>

  Keep it practical for interview practice and use the resume content only.
  File name: ${fileName}
  `;

  try {
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: resumeBase64,
        },
      },
    ]);

    const response = await result.response;
    console.log("✅ Resume analyzed successfully via Gemini API");
    return response.text();
  } catch (error) {
    console.error("❌ Gemini API error in analyzeResumeFromAI:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}