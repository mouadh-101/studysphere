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

@Table({
  tableName: 'paper_citations',
  timestamps: true,
})
export default class PaperCitation extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  citation_id!: string;

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
  citations!: Citation[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: { apa: [], mla: [], chicago: [], ieee: [] },
  })
  formatted_citations!: FormattedCitations;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @BelongsTo(() => ResearchPaper)
  paper!: ResearchPaper;
}
