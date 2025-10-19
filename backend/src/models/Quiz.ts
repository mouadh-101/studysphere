import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, Default } from 'sequelize-typescript';
import User from './User';
import QuizQuestion from './QuizQuestion';

@Table({ tableName: 'quizzes', timestamps: true, createdAt: 'created_at', updatedAt: false })
class Quiz extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  quiz_id!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.STRING)
  quiz_title?: string;

  @Column(DataType.STRING)
  subject?: string;

  @Column(DataType.TEXT)
  file_url?: string;

  @Column(DataType.DATE)
  created_at!: Date;

  @HasMany(() => QuizQuestion)
  questions!: QuizQuestion[];
}
export default Quiz;