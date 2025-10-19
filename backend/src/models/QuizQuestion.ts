import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, Default } from 'sequelize-typescript';
import  Quiz  from './Quiz';

@Table({ tableName: 'quiz_questions', timestamps: false })
class QuizQuestion extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  question_id!: string;

  @ForeignKey(() => Quiz)
  @Column(DataType.UUID)
  quiz_id!: string;

  @BelongsTo(() => Quiz)
  quiz!: Quiz;

  @Column(DataType.JSON)
  question_text!: any;

  @Column(DataType.JSON)
  options!: any;

  @Column(DataType.JSON)
  correct_answer!: any;
}
export default QuizQuestion;