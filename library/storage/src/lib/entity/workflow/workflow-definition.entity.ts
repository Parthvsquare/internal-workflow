/* ──────────────────────────────────────────────────────────────────── */
/* 1.  Mutable "container" that appears in the UI                      */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE workflow_definition (
//   id            UUID PRIMARY KEY,
//   name          TEXT NOT NULL,
//   description   TEXT,
//   segment       TEXT CHECK (segment IN ('CRM','SALES','MARKETING')),
//   category      TEXT,                             -- 'automation', 'integration', 'notification'
//   tags          TEXT[],                           -- User-defined tags for organization
//   latest_ver_id UUID,                           -- FK added after version table
//   is_active     BOOLEAN DEFAULT TRUE,
//   is_template   BOOLEAN DEFAULT FALSE,           -- Template workflows
//   pinned        BOOLEAN DEFAULT FALSE,           -- User can pin favorite workflows
//   created_by    UUID,
//   updated_by    UUID,
//   created_at    TIMESTAMPTZ DEFAULT NOW(),
//   updated_at    TIMESTAMPTZ DEFAULT NOW()
// );

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { WorkflowVersionEntity } from './workflow-version.entity';

@Entity('workflow_definition')
@Index('idx_workflow_definition_key', ['id'])
@Index('idx_workflow_definition_active', ['is_active'])
@Index('idx_workflow_definition_category', ['category'])
export class WorkflowDefinitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  segment?: string;

  @Column({ type: 'text', nullable: true })
  category?: string; // 'automation', 'integration', 'notification', etc.

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]; // User-defined tags for organization

  @Column({ type: 'uuid', nullable: true, name: 'latest_ver_id' })
  latest_ver_id?: string;

  @OneToOne(() => WorkflowVersionEntity)
  @JoinColumn({ name: 'latest_ver_id' })
  latestVersion?: WorkflowVersionEntity;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_template!: boolean; // Template workflows for quick setup

  @Column({ type: 'boolean', default: false })
  pinned!: boolean; // User can pin favorite workflows

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
