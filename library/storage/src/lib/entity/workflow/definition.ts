/* ──────────────────────────────────────────────────────────────────── */
/* 1.  Mutable “container” that appears in the UI                      */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE workflow_definition (
//   id            UUID PRIMARY KEY,
//   name          TEXT NOT NULL,
//   segment       TEXT CHECK (segment IN ('CRM','SALES','MARKETING')),
//   latest_ver_id UUID,                           -- FK added after version table
//   is_active     BOOLEAN DEFAULT TRUE,
//   created_by    UUID,
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
import { WorkflowVersionEntity } from './version';

@Entity('workflow_definition')
@Index('idx_workflow_definition_key', ['id'])
export class WorkflowDefinitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  segment?: string;

  @Column({ type: 'uuid', nullable: true, name: 'latest_ver_id' })
  latest_ver_id?: string;

  @OneToOne(() => WorkflowVersionEntity)
  @JoinColumn({ name: 'latest_ver_id' })
  latestVersion?: WorkflowVersionEntity;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
