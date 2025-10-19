export enum NoteStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface NoteSummary {
  note_id: string;
  user_id: string;
  file_path: string;
  status: NoteStatus;
  transcription?: string;
  summary?: string;
  key_concepts?: string[];
  error_message?: string;
  created_at: string;
  updated_at: string;
  mindmaps?: Mindmap[];
}

export interface Mindmap {
  mindmap_id: string;
  user_id: string;
  note_id: string;
  mindmap_data: MindmapData;
  created_at: string;
  updated_at: string;
}

export interface MindmapData {
  root: string;
  children: MindmapNode[];
}

export interface MindmapNode {
  id?: string;
  label: string;
  children?: MindmapNode[];
}

export interface UploadNoteResponse {
  note_id: string;
  status: NoteStatus;
  message: string;
}

export interface NoteDetailResponse {
  note_id: string;
  status: NoteStatus;
  transcription?: string;
  summary?: string;
  key_concepts?: string[];
  mindmap_data?: MindmapData;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
