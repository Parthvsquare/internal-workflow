/* ──────────────────────────────────────────────────────────────────── */
/* 7.  Runtime: each executed step                                     */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE step_run (
//   run_id           UUID REFERENCES workflow_run(id) ON DELETE CASCADE,
//   step_id          UUID REFERENCES workflow_step(id),
//   status           TEXT CHECK
//                  (status IN ('PENDING','SUCCESS','FAILED','SKIPPED')),
//   started_at       TIMESTAMPTZ,
//   ended_at         TIMESTAMPTZ,
//   idempotency_key  TEXT,
//   PRIMARY KEY (run_id, step_id)
// );

// CREATE INDEX idx_step_status ON step_run (status);

import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Index } from 'typeorm';

@Entity('step_run')
@Index('idx_step_status', ['status'])
export class StepRunEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  run_id!: string;

  @PrimaryColumn({ type: 'uuid', nullable: false })
  step_id!: string;

  @Column({ type: 'text', nullable: true })
  status!: string;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  ended_at?: Date;

  @Column({ type: 'text', nullable: true })
  idempotency_key?: string;
}
