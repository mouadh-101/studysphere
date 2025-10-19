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
  tableName: 'paper_summaries',
  timestamps: true,
})
export default class PaperSummary extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  summary_id!: string;

  @ForeignKey(() => ResearchPaper)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true,
  })
  paper_id!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  abstract!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  key_findings!: string[];

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @BelongsTo(() => ResearchPaper)
  paper!: ResearchPaper;
}
