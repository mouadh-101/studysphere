
import { AssemblyAI } from 'assemblyai';
import fs from 'fs/promises';
import path from 'path';
import { InferenceClient } from '@huggingface/inference';
import NoteSummary, { NoteStatus } from '../models/NoteSummary';
import Mindmap from '../models/Mindmap';

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY || '';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const hfClient = new InferenceClient(HF_API_KEY);
const assemblyClient = new AssemblyAI({ apiKey: ASSEMBLY_API_KEY });


export async function transcribeAudio(filePath: string): Promise<string> {
    const params = { audio: filePath };
    const transcript = await assemblyClient.transcripts.transcribe(params);
    if (!transcript.text) throw new Error('Transcription failed');
    return transcript.text;
}

export async function summarizeAndMindmap(text: string): Promise<{ summary: string; key_concepts: string[]; mindmap_data: any }> {
    const prompt = `Analyze the following note and provide:\n1. A comprehensive summary\n2. Key concepts as an array\n3. Mindmap data structure (root, children)\n\nNote Content:\n${text}\n\nRespond in JSON format as:\n{\n  "summary": "...",
  "key_concepts": ["..."],
  "mindmap_data": { "root": "...", "children": [...] }
}`;

    const chatCompletion = await hfClient.chatCompletion({
        provider: "nebius",
        model: "zai-org/GLM-4.5",
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.7,
    });
    let responseText = chatCompletion.choices[0].message.content || '';
    responseText = responseText.replace(/```json\s*/g, '').replace(/```/g, '');
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON found in AI response');
    const parsed = JSON.parse(responseText.substring(firstBrace, lastBrace + 1));
    return parsed;
}


export async function processNoteAudio(filePath: string, userId: string): Promise<any> {
    // Create note summary with processing status
    const noteSummary = await NoteSummary.create({
        user_id: userId,
        file_path: filePath,
        status: NoteStatus.PROCESSING,
    });

    // Process async (fire and forget)
    processNoteAudioAsync(noteSummary.note_id, filePath, userId).catch(err => {
        console.error('Async processing error:', err);
    });

    // Return immediately with processing status
    return {
        note_id: noteSummary.note_id,
        status: NoteStatus.PROCESSING,
        message: 'Note is being processed. Check status using the ID.',
    };
}

async function processNoteAudioAsync(noteId: string, filePath: string, userId: string): Promise<void> {
    try {
        const transcription = await transcribeAudio(filePath);
        const { summary, key_concepts, mindmap_data } = await summarizeAndMindmap(transcription);

        // Update note summary with results
        await NoteSummary.update(
            {
                transcription,
                summary,
                key_concepts,
                status: NoteStatus.COMPLETED,
            },
            { where: { note_id: noteId } }
        );

        // Save mindmap data in separate Mindmap table
        await Mindmap.create({
            user_id: userId,
            note_id: noteId,
            mindmap_data,
        });
    } catch (error: any) {
        console.error('Error processing note audio:', error);
        await NoteSummary.update(
            {
                status: NoteStatus.FAILED,
                error_message: error.message || 'Unknown error occurred',
            },
            { where: { note_id: noteId } }
        );
    }
}

export async function getNoteSummaryById(noteId: string): Promise<any> {
    const summary = await NoteSummary.findByPk(noteId, {
        include: [{ model: Mindmap }]
    });
    if (!summary) return null;

    // Get mindmap data from the related mindmaps
    const mindmaps = (summary as any).mindmaps || [];
    const mindmap_data = mindmaps.length > 0 ? mindmaps[0].mindmap_data : null;

    return {
        note_id: summary.note_id,
        status: summary.status,
        transcription: summary.transcription,
        summary: summary.summary,
        key_concepts: summary.key_concepts,
        mindmap_data,
        error_message: summary.error_message,
        created_at: summary.created_at,
        updated_at: summary.updated_at,
    };
}

export async function getUserNoteSummaries(userId: string): Promise<any[]> {
    const summaries = await NoteSummary.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
    });
    return summaries;
}

export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
    const summary = await NoteSummary.findByPk(noteId);
    if (!summary) return false;
    if (summary.user_id !== userId) return false;

    // Delete associated mindmaps (will cascade if foreign key is set)
    await Mindmap.destroy({ where: { note_id: noteId } });

    // Delete the summary
    await summary.destroy();
    return true;
}

export const noteSummarizerService = {
    transcribeAudio,
    summarizeAndMindmap,
    processNoteAudio,
    getNoteSummaryById,
    getUserNoteSummaries,
    deleteNote,
};
