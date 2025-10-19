import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import ResearchPaper from './ResearchPaper';

@Table({
  tableName: 'research_questions',
  timestamps: true,
})
export default class ResearchQuestion extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  question_id!: string;

  @ForeignKey(() => ResearchPaper)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true,
  })
  paper_id!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  questions!: string[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  research_gaps!: string[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  methodology_suggestions!: string[];

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @BelongsTo(() => ResearchPaper)
  paper!: ResearchPaper;
}
