import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, Default } from 'sequelize-typescript';
import User from './User';
import ProblemSolution from './ProblemSolution';

export enum ProblemType {
  MATHEMATIC = 'mathematic',
  LINGUISTIC = 'linguistic',
  PROGRAMMING = 'programming',
  SCIENTIFIC = 'scientific',
}

export enum ProblemStatus {
  PENDING = 'pending',
  SOLVED = 'solved',
  FAILED = 'failed',
}

@Table({
  tableName: 'homework_problems',
  timestamps: true,
})
class HomeworkProblem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'problem_id' })
  problem_id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column({ type: DataType.STRING, allowNull: true, field: 'problem_image_url' })
  problem_image_url?: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'file_url' })
  file_url!: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: 'ocr_extracted_text' })
  ocr_extracted_text?: string;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'uploaded_at' })
  uploaded_at!: Date;

  @Column({
    type: DataType.ENUM(...Object.values(ProblemType)),
    allowNull: false,
  })
  type!: ProblemType;

  @Default(ProblemStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(ProblemStatus)),
    allowNull: false,
  })
  status!: ProblemStatus;

  @HasMany(() => ProblemSolution, { foreignKey: 'problem_id', as: 'solutions' })
  solutions!: ProblemSolution[];
}

export default HomeworkProblem;
