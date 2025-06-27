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
//   cancelled_runs  INT DEFAULT 0,
//   timeout_runs    INT DEFAULT 0,
//   avg_latency_ms  NUMERIC,
//   min_latency_ms  NUMERIC,
//   max_latency_ms  NUMERIC,
//   p95_latency_ms  NUMERIC,                        -- 95th percentile latency
//   bounce_rate     NUMERIC,
//   total_errors    INT DEFAULT 0,
//   unique_errors   INT DEFAULT 0,
//   avg_steps       NUMERIC,                        -- Average steps per execution
//   total_api_calls INT DEFAULT 0,                  -- Total external API calls
//   cache_hit_rate  NUMERIC,                        -- Cache hit percentage
//   PRIMARY KEY (workflow_id, day)
// );

import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('daily_workflow_metrics')
@Index('idx_daily_metrics_key', ['workflow_id', 'day'])
@Index('idx_daily_metrics_day', ['day'])
@Index('idx_daily_metrics_workflow', ['workflow_id'])
export class DailyWorkflowMetricsEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'uuid', nullable: false })
  version_id!: string;

  @PrimaryColumn({ type: 'date', nullable: false })
  day!: Date;

  @Column({ type: 'int', nullable: false })
  total_runs!: number;

  @Column({ type: 'int', nullable: false })
  success_runs!: number;

  @Column({ type: 'int', nullable: false })
  failed_runs!: number;

  @Column({ type: 'int', default: 0 })
  cancelled_runs!: number;

  @Column({ type: 'int', default: 0 })
  timeout_runs!: number;

  @Column({ type: 'numeric', nullable: false })
  avg_latency_ms!: number;

  @Column({ type: 'numeric', nullable: true })
  min_latency_ms?: number;

  @Column({ type: 'numeric', nullable: true })
  max_latency_ms?: number;

  @Column({ type: 'numeric', nullable: true })
  p95_latency_ms?: number; // 95th percentile latency

  @Column({ type: 'numeric', nullable: false })
  bounce_rate!: number;

  @Column({ type: 'int', default: 0 })
  total_errors!: number;

  @Column({ type: 'int', default: 0 })
  unique_errors!: number;

  @Column({ type: 'numeric', nullable: true })
  avg_steps?: number; // Average steps per execution

  @Column({ type: 'int', default: 0 })
  total_api_calls!: number; // Total external API calls

  @Column({ type: 'numeric', nullable: true })
  cache_hit_rate?: number; // Cache hit percentage
}
