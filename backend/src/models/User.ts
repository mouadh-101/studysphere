import { Table, Column, Model, DataType, BeforeCreate, BeforeUpdate, HasMany } from 'sequelize-typescript';
import bcrypt from 'bcryptjs';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // Since you only have created_at, we'll disable updatedAt
})
class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    field: 'user_id',
  })
  user_id!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    field: 'email',
    validate: {
      isEmail: true,
    },
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'password_hash',
  })
  password_hash!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'full_name',
  })
  full_name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'university',
  })
  university!: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_login',
  })
  last_login!: Date;

  @HasMany(() => require('./StudyResource').default, {
    foreignKey: 'user_id',
    as: 'studyResources',
  })
  studyResources?: any[];

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if (instance.changed('password_hash')) {
      instance.password_hash = await bcrypt.hash(instance.password_hash, 12);
    }
  }

  // Instance method to check password
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  // Instance method to get user without password
  toSafeObject() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  }
}

export default User;