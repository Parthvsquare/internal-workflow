import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowDefinitionEntity } from './definition.entity';
import { WorkflowTriggerRegistryEntity } from './trigger-registry.entity';

@Entity('workflow_subscription')
@Index('idx_workflow_subscription_trigger', ['trigger_key'])
@Index('idx_workflow_subscription_workflow', ['workflow_id'])
export class WorkflowSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'text', nullable: false })
  trigger_key!: string;

  @Column({ type: 'jsonb', nullable: true })
  filter_conditions?: Record<string, any>; // User-defined filter conditions

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @ManyToOne(() => WorkflowDefinitionEntity)
  @JoinColumn({ name: 'workflow_id' })
  workflow?: WorkflowDefinitionEntity;

  @ManyToOne(() => WorkflowTriggerRegistryEntity, { eager: true })
  @JoinColumn({ name: 'trigger_key', referencedColumnName: 'key' })
  triggerRegistry?: WorkflowTriggerRegistryEntity;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
