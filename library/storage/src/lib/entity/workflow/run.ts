/* ──────────────────────────────────────────────────────────────────── */
/* 6.  Runtime: one row per trigger firing                             */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE workflow_run (
//   id                UUID PRIMARY KEY,
//   workflow_id       UUID REFERENCES workflow_definition(id),
//   version_id        UUID REFERENCES workflow_version(id),
//   trigger_event_id  TEXT,                         -- Kafka offset / UUID
//   status            TEXT CHECK
//                    (status IN ('PENDING','SUCCESS','FAILED')),
//   started_at        TIMESTAMPTZ,
//   ended_at          TIMESTAMPTZ,
//   fail_reason       TEXT
// );

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// CREATE INDEX idx_run_status      ON workflow_run (status);
// CREATE INDEX idx_run_started_at  ON workflow_run (started_at);

@Entity('workflow_run')
@Index('idx_run_status', ['status'])
@Index('idx_run_started_at', ['started_at'])
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
  status!: string;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  ended_at?: Date;

  @Column({ type: 'text', nullable: true })
  fail_reason?: string;
}
