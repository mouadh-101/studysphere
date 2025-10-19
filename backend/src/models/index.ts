import sequelize from '../config/database';
import User from './User';
import ResourceCategory from './ResourceCategory';
import StudyResource from './StudyResource';
import  Quiz from './Quiz';
import QuizQuestion from './QuizQuestion';
import QuizAttempt from './QuizAttempt';
import ConversationSession from './ConversationSession';
import SessionMessage from './SessionMessage';
import HomeworkProblem from './HomeworkProblem';
import ProblemSolution from './ProblemSolution';
import ResearchPaper from './ResearchPaper';
import PaperSummary from './PaperSummary';
import PaperCitation from './PaperCitation';
import ResearchQuestion from './ResearchQuestion';
import NoteSummary from './NoteSummary';
import Mindmap from './Mindmap';

// Add all models to sequelize
sequelize.addModels([User, ResourceCategory, StudyResource, Quiz, QuizQuestion, QuizAttempt, ConversationSession, SessionMessage, HomeworkProblem, ProblemSolution, ResearchPaper, PaperSummary, PaperCitation, ResearchQuestion, NoteSummary, Mindmap]);

const models = {
  User,
  ResourceCategory,
  StudyResource,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  ConversationSession,
  SessionMessage,
  HomeworkProblem,
  ProblemSolution,
  ResearchPaper,
  PaperSummary,
  PaperCitation,
  ResearchQuestion,
  NoteSummary,
  Mindmap,
};

// Associations are defined in the model files using decorators
// No need to manually set up associations here

export { sequelize, User, ResourceCategory, StudyResource, Quiz, QuizQuestion, QuizAttempt, ConversationSession, SessionMessage, HomeworkProblem, ProblemSolution, ResearchPaper, PaperSummary, PaperCitation, ResearchQuestion, NoteSummary, Mindmap };
export default models;