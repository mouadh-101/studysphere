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
import User from './User';
import NoteSummary from './NoteSummary';

@Table({
  tableName: 'mindmaps',
  timestamps: true,
})
export default class Mindmap extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  mindmap_id!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id!: string;

  @ForeignKey(() => NoteSummary)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    unique: true,
  })
  note_id!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
  })
  mindmap_data!: any;

  @CreatedAt
  created_at!: Date;

  @UpdatedAt
  updated_at!: Date;

  // Associations
  @BelongsTo(() => User)
  user!: User;

  @BelongsTo(() => NoteSummary)
  note!: NoteSummary;
}