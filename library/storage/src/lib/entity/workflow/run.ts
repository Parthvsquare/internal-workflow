/* ──────────────────────────────────────────────────────────────────── */
/* 6.  Runtime: one row per trigger firing                             */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE workflow_run (
//   id                UUID PRIMARY KEY,
//   workflow_id       UUID REFERENCES workflow_definition(id),
//   version_id        UUID REFERENCES workflow_version(id),
//   trigger_event_id  TEXT,                         -- Kafka offset / UUID
//   trigger_type      TEXT,                         -- 'webhook', 'schedule', 'manual', 'database'
//   trigger_summary   JSONB,                        -- Summary of trigger data
//   execution_mode    TEXT DEFAULT 'async',         -- 'sync', 'async', 'test'
//   status            TEXT CHECK
//                    (status IN ('PENDING','RUNNING','SUCCESS','FAILED','CANCELLED','TIMEOUT')),
//   total_steps       INT DEFAULT 0,                -- Total steps to execute
//   completed_steps   INT DEFAULT 0,                -- Steps completed
//   failed_steps      INT DEFAULT 0,                -- Steps failed
//   skipped_steps     INT DEFAULT 0,                -- Steps skipped
//   execution_time    INT,                         -- Total execution time in ms
//   retry_count       INT DEFAULT 0,                -- Number of workflow retries
//   max_retries       INT DEFAULT 3,                -- Max allowed retries
//   started_at        TIMESTAMPTZ,
//   ended_at          TIMESTAMPTZ,
//   fail_reason       TEXT,
//   context_data      JSONB,                        -- Additional execution context
//   created_by        UUID,                         -- User who triggered (if manual)
//   created_at        TIMESTAMPTZ DEFAULT NOW(),
//   updated_at        TIMESTAMPTZ DEFAULT NOW()
// );

import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// CREATE INDEX idx_run_status      ON workflow_run (status);
// CREATE INDEX idx_run_started_at  ON workflow_run (started_at);
// CREATE INDEX idx_run_trigger_type ON workflow_run (trigger_type);
// CREATE INDEX idx_run_execution_time ON workflow_run (execution_time);

@Entity('workflow_run')
@Index('idx_run_status', ['status'])
@Index('idx_run_started_at', ['started_at'])
@Index('idx_run_trigger_type', ['trigger_type'])
@Index('idx_run_execution_time', ['execution_time'])
@Index('idx_run_workflow_id', ['workflow_id'])
export class WorkflowRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'uuid', nullable: false })
  version_id!: string;

  @Column({ type: 'text', nullable: true })
  trigger_event_id?: string;

  @Column({ type: 'text', nullable: true })
  trigger_type?: string; // 'webhook', 'schedule', 'manual', 'database'

  @Column({ type: 'jsonb', nullable: true })
  trigger_summary?: Record<string, any>; // Summary of trigger data for quick access

  @Column({ type: 'text', default: 'async' })
  execution_mode!: string; // 'sync', 'async', 'test'

  @Column({ type: 'text', nullable: true })
  status!: string;

  @Column({ type: 'int', default: 0 })
  total_steps!: number; // Total steps to execute

  @Column({ type: 'int', default: 0 })
  completed_steps!: number; // Steps completed successfully

  @Column({ type: 'int', default: 0 })
  failed_steps!: number; // Steps that failed

  @Column({ type: 'int', default: 0 })
  skipped_steps!: number; // Steps that were skipped

  @Column({ type: 'int', nullable: true })
  execution_time?: number; // Total execution time in milliseconds

  @Column({ type: 'int', default: 0 })
  retry_count!: number; // Number of workflow retries

  @Column({ type: 'int', default: 3 })
  max_retries!: number; // Max allowed retries

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at?: Date;

  @Column({ type: 'text', nullable: true })
  fail_reason?: string;

  @Column({ type: 'jsonb', nullable: true })
  context_data?: Record<string, any>; // Additional execution context

  @Column({ type: 'uuid', nullable: true })
  created_by?: string; // User who triggered (if manual)

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
