import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, PrimaryKey, Default } from 'sequelize-typescript';
import User from './User';

@Table({
  tableName: 'conversation_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
class ConversationSession extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'session_id' })
  session_id!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  user_id!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.ENUM('english', 'french', 'spanish'),
    allowNull: false,
    field: 'target_language',
  })
  target_language!: 'english' | 'french' | 'spanish';

  @Column({ type: DataType.STRING, allowNull: true, field: 'conversation_topic' })
  conversation_topic?: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0, field: 'total_messages' })
  total_messages!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW, field: 'created_at' })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW, field: 'updated_at' })
  updated_at!: Date;

  @HasMany(() => require('./SessionMessage').default, { foreignKey: 'session_id', onDelete: 'CASCADE' })
  messages!: any[];
}

export default ConversationSession;
