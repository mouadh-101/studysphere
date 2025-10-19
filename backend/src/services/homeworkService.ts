import { InferenceClient } from '@huggingface/inference';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs/promises';
import HomeworkProblem, { ProblemType, ProblemStatus } from '../models/HomeworkProblem';
import ProblemSolution, { SolutionStep } from '../models/ProblemSolution';
import { PDFParse, TextResult } from 'pdf-parse';
import { readFile } from 'node:fs/promises';

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const OCR_API_KEY = process.env.OCR_API_KEY || '';
const OCR_USERNAME = process.env.OCR_USERNAME || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const hfClient = new InferenceClient(HF_API_KEY);

interface ClassificationResult {
    type: ProblemType;
    confidence: number;
}

interface SolutionResponse {
    step_by_step_solution: SolutionStep[];
    final_answer: string;
    explanation: string;
}

/**
 * Extract text from image using jaided.ai OCR API
 */
export async function extractTextFromImage(filePath: string): Promise<string> {
    try {
        const form = new FormData();
        form.append('file', await fs.readFile(filePath), { filename: 'image.jpg' });

        const response = await axios.post('https://jaided.ai/api/ocr', form, {
            headers: {
                ...form.getHeaders(),
                username: OCR_USERNAME,
                apikey: OCR_API_KEY,
            },
        });

        // Parse OCR response: { status: "success", result: [...], image_id: "..." }
        if (response.data.status === 'success' && Array.isArray(response.data.result)) {
            // Sort by index to maintain order
            const sortedResults = response.data.result.sort((a: any, b: any) => a.ind - b.ind);

            // Extract text from each result, filter by confidence score (>0.5)
            const extractedText = sortedResults
                .filter((item: any) => item.score > 0.5)
                .map((item: any) => item.text)
                .join(' ');

            if (!extractedText.trim()) {
                throw new Error('No text extracted with sufficient confidence');
            }

            return extractedText.trim();
        }

        // Fallback: Handle old response format if API changes
        if (response.data && response.data.text) {
            return response.data.text;
        }

        if (typeof response.data === 'string') {
            return response.data;
        }

        throw new Error('OCR API returned unexpected format');
    } catch (error: any) {
        console.error('OCR extraction error:', error.message);
        throw new Error(`Failed to extract text from image: ${error.message}`);
    }
}

/**
 * Extract text from PDF using pdf-parse
 */
export async function extractTextFromPDF(filePath: string): Promise<TextResult> {
    try {
        const buffer = await readFile(filePath);
        
        // Utilisation correcte de pdf-parse
        const data = await new PDFParse({ data: buffer });
        
        // Le texte est dans la propriété `text` de l'objet retourné
        return data.getText();
    } catch (error: any) {
        console.error('PDF extraction error:', error.message);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * Classify problem type using Hugging Face BART MNLI
 */
export async function classifyProblem(text: string): Promise<ClassificationResult> {
    try {
        const response = await axios.post(
            'https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli',
            {
                inputs: text,
                parameters: {
                    candidate_labels: ['mathematic', 'linguistic', 'programming', 'scientific'],
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const { labels, scores } = response.data;
        const topLabel = labels[0];
        const topScore = scores[0];

        // Map label to ProblemType enum
        const typeMap: Record<string, ProblemType> = {
            mathematic: ProblemType.MATHEMATIC,
            linguistic: ProblemType.LINGUISTIC,
            programming: ProblemType.PROGRAMMING,
            scientific: ProblemType.SCIENTIFIC,
        };

        return {
            type: typeMap[topLabel] || ProblemType.MATHEMATIC,
            confidence: topScore,
        };
    } catch (error: any) {
        console.error('Classification error:', error.message);
        // Default to MATHEMATIC if classification fails
        return {
            type: ProblemType.MATHEMATIC,
            confidence: 0,
        };
    }
}

/**
 * Solve problem using Qwen3-Coder via Hugging Face
 */
export async function solveProblem(text: string, problemType: ProblemType): Promise<SolutionResponse> {
    try {
        const prompt = `You are a homework tutor. Solve this ${problemType} problem step by step.

PROBLEM: ${text}

Provide a detailed solution. Return ONLY valid JSON with this exact structure (no markdown, no extra text):

{
  "step_by_step_solution": [
    {"step": 1, "description": "First step explanation", "calculation": "Formula or code here"},
    {"step": 2, "description": "Second step explanation", "calculation": "Continue work"}
  ],
  "final_answer": "Complete solution or code",
  "explanation": "Overall explanation of the approach"
}`;

        const chatCompletion = await hfClient.chatCompletion({
            provider: "hyperbolic",
            model: "Qwen/Qwen3-Coder-480B-A35B-Instruct",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: 2048,
            temperature: 0.7,
        });

        const responseText = chatCompletion.choices[0].message.content || '';
        console.log('AI Response:', responseText);

        // Clean up response text
        let jsonString = responseText.trim();

        // Remove markdown code blocks
        jsonString = jsonString.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        // Find the first { and last } to extract just the JSON object
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error('No JSON object found in AI response');
        }

        jsonString = jsonString.substring(firstBrace, lastBrace + 1);

        const parsed = JSON.parse(jsonString) as SolutionResponse;

        // Validate structure
        if (!parsed.step_by_step_solution || !Array.isArray(parsed.step_by_step_solution)) {
            throw new Error('AI response missing step_by_step_solution array');
        }
        if (!parsed.final_answer) {
            throw new Error('AI response missing final_answer');
        }
        if (!parsed.explanation) {
            throw new Error('AI response missing explanation');
        }

        return parsed;
    } catch (error: any) {
        console.error('Problem solving error:', error.message);

        // Generate a basic solution based on problem type
        return error;
    }
}


/**
 * Process homework: extract text, classify, solve, and save to database
 */
export async function processHomework(problemId: string): Promise<void> {
    try {
        const problem = await HomeworkProblem.findByPk(problemId);
        if (!problem) {
            throw new Error('Problem not found');
        }

        // Extract text based on file type
        let extractedText: string;
        const fileUrl = problem.file_url;
        const isPDF = fileUrl.toLowerCase().endsWith('.pdf');

        if (isPDF) {
            const pdfResult = await extractTextFromPDF(fileUrl);
            extractedText = pdfResult.text;
        } else {
            extractedText = await extractTextFromImage(fileUrl);
        }

        // Update problem with extracted text
        problem.ocr_extracted_text = extractedText;
        await problem.save();

        // Classify problem type
        const classification = await classifyProblem(extractedText);
        problem.type = classification.type;
        await problem.save();

        // Solve the problem
        const solution = await solveProblem(extractedText, classification.type);

        // Save solution to database
        await ProblemSolution.create({
            problem_id: problemId,
            step_by_step_solution: solution.step_by_step_solution,
            final_answer: solution.final_answer,
            explanation: solution.explanation,
        } as any);

        // Update problem status
        problem.status = ProblemStatus.SOLVED;
        await problem.save();
    } catch (error: any) {
        console.error('Homework processing error:', error.message);

        // Mark problem as failed
        const problem = await HomeworkProblem.findByPk(problemId);
        if (problem) {
            problem.status = ProblemStatus.FAILED;
            await problem.save();
        }

        throw error;
    }
}

/**
 * Delete a homework problem and its associated solution and file
 */
export async function deleteProblem(problemId: string, userId: string): Promise<void> {
    try {
        const problem = await HomeworkProblem.findByPk(problemId);

        if (!problem) {
            throw new Error('Problem not found');
        }

        // Verify ownership
        if (problem.user_id !== userId) {
            throw new Error('Unauthorized: You can only delete your own problems');
        }

        // Delete associated solution if exists
        await ProblemSolution.destroy({
            where: { problem_id: problemId },
        });

        // Delete the uploaded file
        if (problem.file_url) {
            try {
                await fs.unlink(problem.file_url);
                console.log(`Deleted file: ${problem.file_url}`);
            } catch (fileError) {
                console.warn(`Failed to delete file: ${problem.file_url}`, fileError);
                // Continue with deletion even if file removal fails
            }
        }

        // Delete the problem record
        await problem.destroy();

        console.log(`Deleted problem: ${problemId}`);
    } catch (error: any) {
        console.error('Delete problem error:', error.message);
        throw error;
    }
}
