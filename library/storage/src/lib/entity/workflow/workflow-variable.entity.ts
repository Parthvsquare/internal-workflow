/* ──────────────────────────────────────────────────────────────────── */
/* Workflow Variables Storage                                          */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE workflow_variable (
//   id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   workflow_id      UUID REFERENCES workflow_definition(id) ON DELETE CASCADE,
//   key              TEXT NOT NULL,
//   value            JSONB,                           -- Variable value (any type)
//   data_type        TEXT DEFAULT 'string',           -- 'string', 'number', 'boolean', 'object', 'array'
//   is_encrypted     BOOLEAN DEFAULT FALSE,           -- Whether value is encrypted
//   is_secret        BOOLEAN DEFAULT FALSE,           -- Mark as secret (hidden in UI)
//   description      TEXT,                            -- Variable description
//   default_value    JSONB,                           -- Default value if not set
//   created_by       UUID,
//   created_at       TIMESTAMPTZ DEFAULT NOW(),
//   updated_at       TIMESTAMPTZ DEFAULT NOW(),
//   UNIQUE (workflow_id, key)
// );

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

@Entity('workflow_variable')
@Index('idx_workflow_variable_workflow_key', ['workflow_id', 'key'], {
  unique: true,
})
@Index('idx_workflow_variable_workflow', ['workflow_id'])
export class WorkflowVariableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'text', nullable: false })
  key!: string;

  @Column({ type: 'jsonb', nullable: true })
  value?: any; // Variable value (any type)

  @Column({ type: 'text', default: 'string' })
  data_type!: string; // 'string', 'number', 'boolean', 'object', 'array'

  @Column({ type: 'boolean', default: false })
  is_encrypted!: boolean; // Whether value is encrypted

  @Column({ type: 'boolean', default: false })
  is_secret!: boolean; // Mark as secret (hidden in UI)

  @Column({ type: 'text', nullable: true })
  description?: string; // Variable description

  @Column({ type: 'jsonb', nullable: true })
  default_value?: any; // Default value if not set

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
