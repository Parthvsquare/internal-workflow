/* ──────────────────────────────────────────────────────────────────── */
/* 9.  Daily roll-up metrics (populated by batch or streaming job)     */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE daily_workflow_metrics (
//   workflow_id     UUID,
//   version_id      UUID,
//   day             DATE,
//   total_runs      INT,
//   success_runs    INT,
//   failed_runs     INT,
//   avg_latency_ms  NUMERIC,
//   bounce_rate     NUMERIC,
//   PRIMARY KEY (workflow_id, day)
// );

import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('daily_workflow_metrics')
@Index('idx_daily_metrics_key', ['workflow_id', 'day'])
export class DailyWorkflowMetricsEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'uuid', nullable: false })
  version_id!: string;

  @Column({ type: 'date', nullable: false })
  day!: Date;

  @Column({ type: 'int', nullable: false })
  total_runs!: number;

  @Column({ type: 'int', nullable: false })
  success_runs!: number;

  @Column({ type: 'int', nullable: false })
  failed_runs!: number;

  @Column({ type: 'numeric', nullable: false })
  avg_latency_ms!: number;

  @Column({ type: 'numeric', nullable: false })
  bounce_rate!: number;
}
