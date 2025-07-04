/* ──────────────────────────────────────────────────────────────────── */
/* Schedule/Cron Trigger Management                                    */
/* ──────────────────────────────────────────────────────────────────── */

import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowDefinitionEntity } from './workflow-definition.entity';

@Entity('schedule_trigger')
@Index('idx_schedule_trigger_workflow', ['workflow_id'])
@Index('idx_schedule_trigger_next_execution', ['next_execution'])
@Index('idx_schedule_trigger_active', ['is_active'])
export class ScheduleTriggerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: false })
  cron_expression!: string; // Standard cron expression

  @Column({ type: 'text', default: 'UTC' })
  timezone!: string; // Timezone for execution

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_execution?: Date; // Last execution time

  @Column({ type: 'timestamptz', nullable: true })
  next_execution?: Date; // Next scheduled execution

  @Column({ type: 'int', default: 0 })
  execution_count!: number; // Total executions

  @Column({ type: 'int', nullable: true })
  max_executions?: number; // Max executions (null = unlimited)

  @Column({ type: 'jsonb', nullable: true })
  execution_data?: Record<string, any>; // Data to pass to workflow

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @ManyToOne(() => WorkflowDefinitionEntity)
  @JoinColumn({ name: 'workflow_id' })
  workflow?: WorkflowDefinitionEntity;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
