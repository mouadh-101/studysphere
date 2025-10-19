export interface ResearchPaper {
  paper_id: string;
  user_id: string;
  title: string;
  file_path: string;
  text_content?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
  summary?: PaperSummary;
  citations?: PaperCitation;
  research_questions?: ResearchQuestion;
}

export interface PaperSummary {
  summary_id: string;
  paper_id: string;
  abstract: string;
  key_findings: string[];
  created_at: string;
  updated_at: string;
}

export interface Citation {
  authors: string[];
  title: string;
  year?: string;
  journal?: string;
  doi?: string;
}

export interface FormattedCitations {
  apa: string[];
  mla: string[];
  chicago: string[];
  ieee: string[];
}

export interface PaperCitation {
  citation_id: string;
  paper_id: string;
  citations: Citation[];
  formatted_citations: FormattedCitations;
  created_at: string;
  updated_at: string;
}

export interface ResearchQuestion {
  question_id: string;
  paper_id: string;
  questions: string[];
  research_gaps: string[];
  methodology_suggestions: string[];
  created_at: string;
  updated_at: string;
}

export interface UploadPaperResponse {
  success: boolean;
  message: string;
  paper: Pick<ResearchPaper, 'paper_id' | 'title' | 'status' | 'created_at'>;
}

export interface RelatedPaper {
  paperId: string;
  title: string;
  url: string;
  abstract?: string;
  authors?: Array<{ authorId: string; name: string }>;
}
