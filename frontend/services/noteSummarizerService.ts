import { apiClient } from './authService';
import type {
  NoteSummary,
  Mindmap,
  MindmapData,
  UploadNoteResponse,
  NoteDetailResponse,
  NoteStatus,
} from './types/noteSummarizer';

export type {
  NoteSummary,
  Mindmap,
  MindmapData,
  UploadNoteResponse,
  NoteDetailResponse,
  NoteStatus,
};

/**
 * Upload an audio file for transcription and summarization
 */
const uploadAudioNote = async (file: File): Promise<UploadNoteResponse> => {
  try {
    const formData = new FormData();
    formData.append('audio', file);

    const response = await apiClient.post<UploadNoteResponse>('/api/notes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to upload audio note');
    }
    throw new Error('Unexpected error while uploading audio note');
  }
};

/**
 * Get all note summaries for the authenticated user
 */
const getUserNotes = async (): Promise<NoteSummary[]> => {
  try {
    const response = await apiClient.get<NoteSummary[]>('/api/notes/list');
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to fetch notes');
    }
    throw new Error('Unexpected error while fetching notes');
  }
};

/**
 * Get a specific note summary with mindmap (use for polling)
 */
const getNoteById = async (noteId: string): Promise<NoteDetailResponse> => {
  try {
    const response = await apiClient.get<NoteDetailResponse>(`/api/notes/${noteId}`);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to fetch note');
    }
    throw new Error('Unexpected error while fetching note');
  }
};

/**
 * Delete a note summary and its mindmap
 */
const deleteNote = async (noteId: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/api/notes/${noteId}`);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.error || error.response.data?.message || 'Failed to delete note');
    }
    throw new Error('Unexpected error while deleting note');
  }
};

/**
 * Poll for note completion
 * Returns a promise that resolves when the note is completed or failed
 */
const pollNoteCompletion = async (
  noteId: string,
  onProgress?: (note: NoteDetailResponse) => void,
  maxAttempts = 60,
  interval = 5000
): Promise<NoteDetailResponse> => {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const note = await getNoteById(noteId);
        
        // Notify progress callback
        if (onProgress) {
          onProgress(note);
        }

        // Check if processing is complete
        if (note.status === 'completed') {
          resolve(note);
          return;
        }

        if (note.status === 'failed') {
          reject(new Error(note.error_message || 'Note processing failed'));
          return;
        }

        // Continue polling if still processing
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error('Polling timeout: Note processing took too long'));
          return;
        }

        setTimeout(poll, interval);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};

export const noteSummarizerService = {
  uploadAudioNote,
  getUserNotes,
  getNoteById,
  deleteNote,
  pollNoteCompletion,
};
