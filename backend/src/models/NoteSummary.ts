import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import User from './User';
import Mindmap from './Mindmap';

export enum NoteStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Table({
  tableName: 'note_summaries',
  timestamps: true,
})
export default class NoteSummary extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  note_id!: string;

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
  file_path!: string;

  @Column({
    type: DataType.ENUM(...Object.values(NoteStatus)),
    defaultValue: NoteStatus.PENDING,
  })
  status!: NoteStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  transcription!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  summary!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: [],
  })
  key_concepts!: string[];

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

  @HasMany(() => Mindmap)
  mindmaps!: Mindmap[];
}