// Quiz types
export interface Quiz {
  quiz_id: string;
  user_id: string;
  quiz_title?: string;
  subject?: string;
  file_url?: string;
  created_at: string;
  user?: {
    user_id: string;
    full_name: string;
    email: string;
  };
  questions?: QuizQuestion[];
  questionCount?: number;
}

// Quiz Question type
export interface QuizQuestion {
  question_id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
}

// Quiz Attempt type
export interface QuizAttempt {
  attempt_id: string;
  user_id: string;
  quiz_id: string;
  start_time: string;
  end_time: string;
  score: number;
  answers: Record<string, string>;
  completed: boolean;
  quiz?: Quiz;
}

// Generate quiz data
export interface GenerateQuizData {
  file: File;
  numQuestions: number;
  difficulty: string;
}

// Submit attempt data
export interface SubmitAttemptData {
  answers: Record<string, string>; // { question_id: selected_answer }
}

// Quiz response type
export interface QuizResponse {
  success: boolean;
  message: string;
  data: {
    quiz_id?: string;
    quiz?: Quiz;
    quizzes?: Quiz[];
  };
}

// Attempt response type
export interface AttemptResponse {
  success: boolean;
  message: string;
  data: {
    attempt_id?: string;
    attempt?: QuizAttempt;
    attempts?: QuizAttempt[];
    score?: number;
    total?: number;
    percentage?: number;
  };
}
