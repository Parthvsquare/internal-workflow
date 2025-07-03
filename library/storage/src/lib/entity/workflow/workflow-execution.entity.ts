/* ──────────────────────────────────────────────────────────────────── */
/* 6.  Runtime: one row per trigger firing                             */
/* ──────────────────────────────────────────────────────────────────── */

import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflow_execution')
@Index('idx_execution_status', ['status'])
@Index('idx_execution_started_at', ['started_at'])
@Index('idx_execution_trigger_type', ['trigger_type'])
@Index('idx_execution_execution_time', ['execution_time'])
@Index('idx_execution_workflow_id', ['workflow_id'])
export class WorkflowExecutionEntity {
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

  // Enhanced metrics (consolidated from ExecutionMetricsEntity)
  @Column({ type: 'int', nullable: true })
  queue_time?: number; // Time spent in queue before execution

  @Column({ type: 'int', nullable: true })
  memory_usage?: number; // Peak memory usage in MB

  @Column({ type: 'int', nullable: true })
  cpu_time?: number; // CPU time in ms

  @Column({ type: 'int', default: 0 })
  network_calls!: number; // Number of external API calls

  @Column({ type: 'int', default: 0 })
  network_time!: number; // Time spent on network calls

  @Column({ type: 'int', default: 0 })
  cache_hits!: number; // Number of cache hits

  @Column({ type: 'int', default: 0 })
  cache_misses!: number; // Number of cache misses

  @Column({ type: 'int', default: 0 })
  error_count!: number; // Number of errors encountered

  @Column({ type: 'int', default: 0 })
  warning_count!: number; // Number of warnings

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

  // Computed properties for convenience
  get success_rate(): number | null {
    if (this.total_steps === 0) return null;
    return (this.completed_steps / this.total_steps) * 100;
  }

  get cache_hit_rate(): number | null {
    const total_cache_requests = this.cache_hits + this.cache_misses;
    if (total_cache_requests === 0) return null;
    return (this.cache_hits / total_cache_requests) * 100;
  }
}
