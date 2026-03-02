import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables FIRST before reading them
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️  GEMINI_API_KEY not found in environment variables. Using fallback responses only.");
}

let genAI;
let model;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: "gemini-flash-latest"
    });
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error.message);
  }
}

export async function generateQuestionFromAI(prompt) {
  if (!model) {
    throw new Error("Gemini API not initialized. Missing GEMINI_API_KEY.");
  }
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function evaluateAnswerFromAI(prompt) {
  if (!model) {
    throw new Error("Gemini API not initialized. Missing GEMINI_API_KEY.");
  }
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
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
  return response.text();
}