/* ──────────────────────────────────────────────────────────────────── */
/* 8.  Fine-grained log lines (optional time-based partition later)    */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE execution_log (
//   id         BIGSERIAL PRIMARY KEY,
//   run_id     UUID REFERENCES workflow_run(id) ON DELETE CASCADE,
//   step_id    UUID,
//   level      TEXT CHECK (level IN ('DEBUG','INFO','WARN','ERROR')),
//   message    TEXT,
//   ts         TIMESTAMPTZ DEFAULT NOW()
// );

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// CREATE INDEX idx_log_run ON execution_log (run_id);
// CREATE INDEX idx_log_ts  ON execution_log (ts);

@Entity('execution_log')
@Index('idx_log_run', ['run_id'])
@Index('idx_log_ts', ['ts'])
export class ExecutionLogEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'uuid', nullable: false })
  run_id!: string;

  @Column({ type: 'uuid', nullable: true })
  step_id?: string;

  @Column({ type: 'text', nullable: false })
  level!: string;

  @Column({ type: 'text', nullable: false })
  message!: string;

  @Column({ type: 'timestamp', nullable: false })
  ts!: Date;
}
