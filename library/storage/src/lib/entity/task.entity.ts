import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  IN_PROGRESS = 'in_progress',
  CANCELLED = 'cancelled',
}

export enum TaskRelatedEntityType {
  CRM_LEAD = 'crm_leads',
}

@Index(['entityId'])
@Entity('tasks')
export class TaskEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  entityId!: string;

  @Column({ type: 'varchar', length: 255 })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'varchar', length: 30, default: TaskStatus.PENDING })
  status?: TaskStatus;

  @Column({ type: 'varchar', nullable: true })
  entityType?: TaskRelatedEntityType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cronExpression?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
