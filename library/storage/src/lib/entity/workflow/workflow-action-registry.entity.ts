import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflow_action_registry')
@Index('idx_workflow_action_registry_key', ['key'])
export class WorkflowActionRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true, nullable: false })
  key!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  display_name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  category?: string;

  @Column({ type: 'text', array: true, default: ['action'] })
  group!: string[];

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @Column({ type: 'text', nullable: true })
  icon_color?: string;

  @Column({ type: 'text', nullable: true })
  documentation_url?: string;

  @Column({ type: 'text', nullable: true })
  execution_type?: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'jsonb', default: {} })
  properties_schema?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  credentials_schema?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  operation_schema?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  filter_schema?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  sample_payload?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  methods?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
