import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

@Table({
  tableName: 'resources_category',
  timestamps: false,
})
class ResourceCategory extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    field: 'category_id',
  })
  category_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'name',
  })
  name!: string;

  @HasMany(() => require('./StudyResource').default, {
    foreignKey: 'category',
    as: 'resources',
  })
  resources?: any[];
}

export default ResourceCategory;
