import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, Default } from 'sequelize-typescript';
import HomeworkProblem from './HomeworkProblem';

export interface SolutionStep {
  step: number;
  description: string;
  calculation?: string;
}

@Table({
  tableName: 'problem_solutions',
  timestamps: true,
})
class ProblemSolution extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'solution_id' })
  solution_id!: string;

  @ForeignKey(() => HomeworkProblem)
  @Column({ type: DataType.UUID, allowNull: false })
  problem_id!: string;

  @BelongsTo(() => HomeworkProblem)
  problem!: HomeworkProblem;

  @Column({ type: DataType.JSON, allowNull: false, field: 'step_by_step_solution' })
  step_by_step_solution!: SolutionStep[];

  @Column({ type: DataType.TEXT, allowNull: false, field: 'final_answer' })
  final_answer!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  explanation!: string;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, field: 'created_at' })
  created_at!: Date;
}

export default ProblemSolution;
