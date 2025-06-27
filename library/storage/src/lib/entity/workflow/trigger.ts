// CREATE TABLE workflow_trigger (
//   id          UUID PRIMARY KEY,
//   version_id  UUID REFERENCES workflow_version(id) ON DELETE CASCADE,
//   trigger_key TEXT NOT NULL,          -- e.g. opportunity.updated
//   filters     JSONB
// );

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflow_trigger')
@Index('idx_workflow_trigger_key', ['version_id', 'trigger_key'])
export class WorkflowTriggerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  version_id!: string;

  @Column({ type: 'text', nullable: false })
  trigger_key!: string;

  @Column({ type: 'jsonb', nullable: true })
  filters?: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
