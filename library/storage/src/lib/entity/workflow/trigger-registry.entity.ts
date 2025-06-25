import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflow_trigger_registry')
@Index('idx_workflow_trigger_registry_key', ['key'])
export class WorkflowTriggerRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  key!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  display_name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'text', nullable: true })
  event_source?: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'jsonb', default: {} })
  properties_schema?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  filter_schema?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  sample_payload?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  webhook_config?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  available_variables?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
