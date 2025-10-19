import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';

@Table({
  tableName: 'study_resources',
  timestamps: false,
})
class StudyResource extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    field: 'resource_id',
  })
  resource_id!: string;

  @ForeignKey(() => require('./User').default)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id',
  })
  user_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'title',
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'description',
  })
  description!: string;

  @ForeignKey(() => require('./ResourceCategory').default)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'category',
  })
  category!: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    field: 'file_url',
  })
  file_url!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'download_count',
  })
  download_count!: number;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  created_at!: Date;

  @BelongsTo(() => require('./User').default, {
    foreignKey: 'user_id',
    as: 'user',
  })
  user?: any;

  @BelongsTo(() => require('./ResourceCategory').default, {
    foreignKey: 'category',
    as: 'resourceCategory',
  })
  resourceCategory?: any;
}

export default StudyResource;
