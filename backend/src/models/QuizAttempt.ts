import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, Default } from 'sequelize-typescript';
import User from './User';
import  Quiz from './Quiz';

@Table({ tableName: 'quiz_attempts', timestamps: false })
class QuizAttempt extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  attempt_id!: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Quiz)
  @Column(DataType.UUID)
  quiz_id!: string;

  @BelongsTo(() => Quiz)
  quiz!: Quiz;

  @Column(DataType.DATE)
  start_time!: Date;

  @Column(DataType.DATE)
  end_time!: Date;

  @Column(DataType.DECIMAL)
  score!: number;

  @Column(DataType.JSON)
  answers!: any;

  @Column(DataType.BOOLEAN)
  completed!: boolean;
}
export default QuizAttempt;