import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasOne,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import User from './User';
import PaperSummary from './PaperSummary';
import PaperCitation from './PaperCitation';
import ResearchQuestion from './ResearchQuestion';

export enum PaperStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Table({
  tableName: 'research_papers',
  timestamps: true,
})
export default class ResearchPaper extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  paper_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_path!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  text_content!: string;

  @Column({
    type: DataType.ENUM(...Object.values(PaperStatus)),
    defaultValue: PaperStatus.PENDING,
  })
  status!: PaperStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  error_message!: string;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @BelongsTo(() => User)
  user!: User;

  @HasOne(() => PaperSummary)
  summary!: PaperSummary;

  @HasOne(() => PaperCitation)
  citations!: PaperCitation;

  @HasOne(() => ResearchQuestion)
  research_questions!: ResearchQuestion;
}
