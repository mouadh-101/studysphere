
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface GeminiQuizParams {
  filePath: string;
  numQuestions: number;
  difficulty: string;
}

export interface GeminiQuizQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
}

export interface GeminiQuizResponse {
  quiz_title: string;
  subject: string;
  questions: GeminiQuizQuestion[];
}

export async function generateQuizWithGemini(params: GeminiQuizParams): Promise<GeminiQuizResponse> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not set');

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  // Upload file to Gemini using file path
  const mimeType = 'application/pdf'; // You may want to detect this dynamically based on file extension
  const uploadedFile = await ai.files.upload({
    file: params.filePath,
    config: { mimeType },
  });

  // Build prompt with detailed format specification
  const promptText = `Generate a quiz from the following course document.

Requirements:
- Number of Questions: ${params.numQuestions}
- Difficulty Level: ${params.difficulty}

You must return ONLY a valid JSON object with the following exact structure (no markdown, no code blocks, no additional text):

{
  "quiz_title": "string - A descriptive title for the quiz based on the document content",
  "subject": "string - The main subject/topic covered in the document",
  "questions": [
    {
      "question_text": "string - The question text",
      "options": ["string - option A", "string - option B", "string - option C", "string - option D"],
      "correct_answer": "string - The exact text of the correct option from the options array"
    }
  ]
}

Important Rules:
1. Each question must have exactly 4 options
2. The correct_answer must be the EXACT TEXT of one of the options (not just A, B, C, or D)
3. Questions should be multiple choice only
4. Return ONLY the JSON object, no additional text before or after
5. Ensure the JSON is valid and properly formatted
6. Make questions clear and unambiguous
7. Base all questions strictly on the document content`;

  const contents = createUserContent([
    createPartFromUri(uploadedFile.uri || '', uploadedFile.mimeType || mimeType),
    promptText,
  ]);

  // Call Gemini model
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  // Parse Gemini response
  const text = response.text || '';
  
  // Remove markdown code blocks if present
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
  }
  
  let quizData: GeminiQuizResponse;
  try {
    quizData = JSON.parse(cleanedText);
    
    // Validate response structure
    if (!quizData.quiz_title || !quizData.subject || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid response structure: missing required fields');
    }
    
    if (quizData.questions.length === 0) {
      throw new Error('No questions generated');
    }
    
    // Validate each question
    quizData.questions.forEach((q, index) => {
      if (!q.question_text || !Array.isArray(q.options) || !q.correct_answer) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }
      if (q.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }
      if (!q.options.includes(q.correct_answer)) {
        throw new Error(`Question ${index + 1} correct_answer must match one of the options`);
      }
    });
    
  } catch (err) {
    console.error('Gemini response parsing error:', err);
    console.error('Raw response:', text);
    throw new Error(`Failed to parse Gemini response: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
  }
  return quizData;
}

/**
 * Generate text using Gemini for research paper analysis
 */
export async function generateText(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not set');

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const contents = createUserContent([prompt]);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  const text = response.text || '';

  if (!text) {
    throw new Error('No response from Gemini');
  }

  return text;
}
