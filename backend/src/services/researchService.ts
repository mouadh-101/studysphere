import { HfInference } from '@huggingface/inference';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import ResearchPaper, { PaperStatus } from '../models/ResearchPaper';
import PaperSummary from '../models/PaperSummary';
import PaperCitation from '../models/PaperCitation';
import ResearchQuestion from '../models/ResearchQuestion';
import type { Citation, FormattedCitations } from '../models/PaperCitation';
import { generateText as geminiGenerateText } from './geminiService';
import { extractTextFromPDF } from './homeworkService';

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// PDF parser with typed require
const pdfParse = require('pdf-parse') as (dataBuffer: Buffer) => Promise<{ text: string; numpages: number; info: any }>;

// Mammoth for DOCX parsing
const mammoth = require('mammoth') as {
    extractRawText: (options: { path: string }) => Promise<{ value: string; messages: any[] }>;
};

interface RelatedPaper {
    paperId: string;
    title: string;
    url: string;
    abstract?: string;
    authors?: Array<{ authorId: string; name: string }>;
}

interface SemanticScholarResponse {
    total: number;
    offset: number;
    next: number;
    data: Array<{
        paperId: string;
        title: string;
        url: string;
        abstract?: string;
        authors?: Array<{ authorId: string; name: string }>;
    }>;
}



/**
 * Extract text from DOCX file
 */
async function extractTextFromDocx(filePath: string): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error('Error extracting text from DOCX:', error);
        throw new Error('Failed to extract text from DOCX');
    }
}

/**
 * Generate summary and key findings using Gemini
 */
async function generateSummary(textContent: string): Promise<{ abstract: string; key_findings: string[] }> {
    try {
        const prompt = `Analyze the following research paper and provide:
1. A concise abstract (150-200 words)
2. A list of 5-7 key findings

Research Paper Content:
${textContent.substring(0, 10000)} // Limit to first 10000 chars for API

Please respond in JSON format:
{
  "abstract": "your abstract here",
  "key_findings": ["finding 1", "finding 2", ...]
}`;

        const result = await geminiGenerateText(prompt);

        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            abstract: parsed.abstract || '',
            key_findings: parsed.key_findings || [],
        };
    } catch (error) {
        console.error('Error generating summary:', error);
        throw new Error('Failed to generate summary');
    }
}

/**
 * Extract citations using Gemini
 */
async function extractCitations(textContent: string): Promise<Citation[]> {
    try {
        const prompt = `Extract all citations/references from the following research paper.
For each citation, extract: authors (as array), title, year, journal, and DOI if available.

Research Paper Content:
${textContent.substring(0, 10000)}

Please respond in JSON format:
{
  "citations": [
    {
      "authors": ["Author 1", "Author 2"],
      "title": "Paper title",
      "year": "2023",
      "journal": "Journal name",
      "doi": "10.1234/example"
    }
  ]
}`;

        const result = await geminiGenerateText(prompt);

        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return [];
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.citations || [];
    } catch (error) {
        console.error('Error extracting citations:', error);
        return [];
    }
}

/**
 * Format citation in different styles
 */
function formatCitation(citation: Citation, style: 'apa' | 'mla' | 'chicago' | 'ieee'): string {
    const authors = Array.isArray(citation.authors) ? citation.authors.join(', ') : '';
    const year = citation.year || 'n.d.';
    const title = citation.title;
    const journal = citation.journal || '';

    switch (style) {
        case 'apa':
            return `${authors} (${year}). ${title}. ${journal}. ${citation.doi ? `https://doi.org/${citation.doi}` : ''}`.trim();

        case 'mla':
            return `${authors}. "${title}." ${journal}, ${year}. ${citation.doi ? `DOI: ${citation.doi}` : ''}`.trim();

        case 'chicago':
            return `${authors}. "${title}." ${journal} (${year}). ${citation.doi ? `https://doi.org/${citation.doi}` : ''}`.trim();

        case 'ieee':
            return `${authors}, "${title}," ${journal}, ${year}. ${citation.doi ? `DOI: ${citation.doi}` : ''}`.trim();

        default:
            return `${authors} (${year}). ${title}. ${journal}`.trim();
    }
}

/**
 * Format all citations in different styles
 */
function formatCitations(citations: Citation[]): FormattedCitations {
    return {
        apa: citations.map(c => formatCitation(c, 'apa')),
        mla: citations.map(c => formatCitation(c, 'mla')),
        chicago: citations.map(c => formatCitation(c, 'chicago')),
        ieee: citations.map(c => formatCitation(c, 'ieee')),
    };
}

/**
 * Generate research questions and identify gaps using Qwen
 */
async function generateResearchQuestions(textContent: string): Promise<{ questions: string[]; research_gaps: string[] }> {
    try {
        const prompt = `Based on the following research paper, help formulate:
1. 5-7 potential research questions for further study
2. 3-5 research gaps or unanswered questions

Research Paper Content:
${textContent.substring(0, 8000)}

Please respond in JSON format:
{
  "questions": ["question 1", "question 2", ...],
  "research_gaps": ["gap 1", "gap 2", ...]
}`;

        const result = await hf.chatCompletion({
            model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.7,
        });

        const content = result.choices[0]?.message?.content || '{}';

        // Extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { questions: [], research_gaps: [] };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            questions: parsed.questions || [],
            research_gaps: parsed.research_gaps || [],
        };
    } catch (error) {
        console.error('Error generating research questions:', error);
        return { questions: [], research_gaps: [] };
    }
}

/**
 * Suggest research methodologies using Qwen
 */
async function suggestMethodology(textContent: string): Promise<string[]> {
    try {
        const prompt = `Based on the following research paper, suggest 3-5 appropriate research methodologies that could be used for further study in this area.

Research Paper Content:
${textContent.substring(0, 8000)}

Please respond in JSON format:
{
  "methodologies": ["methodology 1", "methodology 2", ...]
}`;

        const result = await hf.chatCompletion({
            model: 'Qwen/Qwen3-480B-A35B-Instruct',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
        });

        const content = result.choices[0]?.message?.content || '{}';

        // Extract JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return [];
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.methodologies || [];
    } catch (error) {
        console.error('Error suggesting methodology:', error);
        return [];
    }
}

/**
 * Find related papers using Semantic Scholar API
 * - Supports optional API key via SEMANTIC_SCHOLAR_API_KEY
 * - Retries on 429 with exponential backoff
 */
async function findRelatedPapers(query: string, limit: number = 10): Promise<RelatedPaper[]> {
    const apiUrl = 'https://api.semanticscholar.org/graph/v1/paper/search';
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    const maxRetries = 3;

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.get<SemanticScholarResponse>(apiUrl, {
                params: {
                    query,
                    fields: 'title,url,abstract,authors',
                    limit,
                },
                headers: {
                    ...(apiKey ? { 'x-api-key': apiKey } : {}),
                    // Optional: identify your app; some APIs prefer a UA string
                    'User-Agent': 'StudySphere/1.0 (Research Module)'
                },
                // modest timeout to avoid hanging
                timeout: 10000,
            });

            return response.data.data.map(paper => ({
                paperId: paper.paperId,
                title: paper.title,
                url: paper.url,
                abstract: paper.abstract,
                authors: paper.authors,
            }));
        } catch (err: any) {
            const status = err?.response?.status;
            // Handle rate limits with retry
            if (status === 429 && attempt < maxRetries) {
                const retryAfterHeader = err.response?.headers?.['retry-after'];
                const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : 500 * Math.pow(2, attempt);
                console.warn(`Semantic Scholar rate limited (429). Retry attempt ${attempt + 1} in ${retryAfterMs} ms...`);
                await sleep(retryAfterMs);
                continue; // try again
            }

            // For other errors or final failure, throw a generic error
            console.error('Error fetching related papers:', err);
            throw new Error('Failed to fetch related papers from Semantic Scholar');
        }
    }

    // Should not reach here due to throw above, but TypeScript requires a return
    return [];
}

/**
 * Process uploaded research paper
 */
async function processPaper(paperId: string): Promise<void> {
    try {
        const paper = await ResearchPaper.findByPk(paperId);
        if (!paper) {
            throw new Error('Paper not found');
        }

        // Update status to processing
        await paper.update({ status: PaperStatus.PROCESSING });

        // Extract text based on file type
        let textContent: string;
        const fileExt = path.extname(paper.file_path).toLowerCase();

        if (fileExt === '.pdf') {
            const pdfResult = await extractTextFromPDF(paper.file_path);
            textContent = pdfResult.text;
        } else if (fileExt === '.docx' || fileExt === '.doc') {
            textContent = await extractTextFromDocx(paper.file_path);
        } else {
            throw new Error('Unsupported file format');
        }

        // Update paper with extracted text
        await paper.update({ text_content: textContent });

        // Generate summary and key findings
        const { abstract, key_findings } = await generateSummary(textContent);
        await PaperSummary.create({
            paper_id: paperId,
            abstract,
            key_findings,
        });

        // Extract and format citations
        const citations = await extractCitations(textContent);
        const formatted_citations = formatCitations(citations);
        await PaperCitation.create({
            paper_id: paperId,
            citations,
            formatted_citations,
        });

        // Generate research questions and suggestions
        const { questions, research_gaps } = await generateResearchQuestions(textContent);
        const methodology_suggestions = await suggestMethodology(textContent);
        await ResearchQuestion.create({
            paper_id: paperId,
            questions,
            research_gaps,
            methodology_suggestions,
        });

        // Update status to completed
        await paper.update({ status: PaperStatus.COMPLETED });

    } catch (error: any) {
        console.error('Error processing paper:', error);

        // Update paper with error status
        const paper = await ResearchPaper.findByPk(paperId);
        if (paper) {
            await paper.update({
                status: PaperStatus.FAILED,
                error_message: error.message || 'Unknown error occurred',
            });
        }
    }
}

/**
 * Delete paper and all associated data
 */
async function deletePaper(paperId: string, userId: string): Promise<void> {
    const paper = await ResearchPaper.findByPk(paperId);

    if (!paper) {
        throw new Error('Paper not found');
    }

    if (paper.user_id !== userId) {
        throw new Error('Unauthorized to delete this paper');
    }

    // Delete associated data (will cascade due to foreign key constraints)
    await PaperSummary.destroy({ where: { paper_id: paperId } });
    await PaperCitation.destroy({ where: { paper_id: paperId } });
    await ResearchQuestion.destroy({ where: { paper_id: paperId } });

    // Delete file from disk
    try {
        await fs.unlink(paper.file_path);
    } catch (error) {
        console.error('Error deleting file:', error);
    }

    // Delete paper record
    await paper.destroy();
}

export const researchService = {
    extractTextFromPDF,
    extractTextFromDocx,
    generateSummary,
    extractCitations,
    formatCitations,
    generateResearchQuestions,
    suggestMethodology,
    findRelatedPapers,
    processPaper,
    deletePaper,
};
