// Homework Problem Types
export interface HomeworkProblem {
  problemId: string;
  fileUrl: string;
  problemImageUrl: string;
  extractedText?: string;
  type: 'mathematic' | 'linguistic' | 'programming' | 'scientific';
  status: 'pending' | 'solved' | 'failed';
  uploadedAt: string;
  hasSolution?: boolean;
}

export interface SolutionStep {
  step: number;
  description: string;
  calculation: string;
}

export interface ProblemSolution {
  solutionId: string;
  stepByStepSolution: SolutionStep[];
  finalAnswer: string;
  explanation: string;
  createdAt: string;
}

export interface ProblemWithSolution {
  problem: {
    problemId: string;
    fileUrl: string;
    problemImageUrl: string;
    extractedText?: string;
    type: 'mathematic' | 'linguistic' | 'programming' | 'scientific';
    status: 'pending' | 'solved' | 'failed';
    uploadedAt: string;
  };
  solution: ProblemSolution | null;
}

export interface UploadResponse {
  success: boolean;
  data: {
    problemId: string;
    status: string;
  };
  message: string;
}

export type ProblemType = 'mathematic' | 'linguistic' | 'programming' | 'scientific';
export type ProblemStatus = 'pending' | 'solved' | 'failed';
