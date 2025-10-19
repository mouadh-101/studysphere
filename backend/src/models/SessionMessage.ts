import { Table, Column, Model, DataType, ForeignKey, BelongsTo, PrimaryKey, Default, Index } from 'sequelize-typescript';

@Table({
  tableName: 'session_messages',
  timestamps: false,
})
class SessionMessage extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, field: 'message_id' })
  message_id!: string;

  @ForeignKey(() => require('./ConversationSession').default)
  @Index
  @Column({ type: DataType.UUID, allowNull: false })
  session_id!: string;

  @BelongsTo(() => require('./ConversationSession').default, { onDelete: 'CASCADE' })
  session!: any;

  @Column({
    type: DataType.ENUM('user', 'ai'),
    allowNull: false,
    field: 'message_type',
  })
  message_type!: 'user' | 'ai';

  @Column({ type: DataType.TEXT, allowNull: true })
  content!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false })
  message_order!: number;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW, field: 'created_at' })
  created_at!: Date;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  processed!: boolean;
}

export default SessionMessage;
