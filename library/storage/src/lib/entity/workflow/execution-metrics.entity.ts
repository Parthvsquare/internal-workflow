/* ──────────────────────────────────────────────────────────────────── */
/* Detailed Execution Metrics and Analytics                           */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE execution_metrics (
//   id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   run_id            UUID REFERENCES workflow_run(id) ON DELETE CASCADE,
//   workflow_id       UUID NOT NULL,
//   version_id        UUID NOT NULL,
//   trigger_type      TEXT,
//   execution_time    INT NOT NULL,                   -- Total execution time in ms
//   queue_time        INT,                           -- Time spent in queue before execution
//   step_count        INT NOT NULL,                  -- Number of steps executed
//   success_rate      NUMERIC(5,2),                  -- Percentage of successful steps
//   memory_usage      INT,                           -- Peak memory usage in MB
//   cpu_time          INT,                           -- CPU time in ms
//   network_calls     INT DEFAULT 0,                 -- Number of external API calls
//   network_time      INT DEFAULT 0,                 -- Time spent on network calls
//   cache_hits        INT DEFAULT 0,                 -- Number of cache hits
//   cache_misses      INT DEFAULT 0,                 -- Number of cache misses
//   error_count       INT DEFAULT 0,                 -- Number of errors encountered
//   warning_count     INT DEFAULT 0,                 -- Number of warnings
//   created_at        TIMESTAMPTZ DEFAULT NOW()
// );

import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowRunEntity } from './run';
import { WorkflowDefinitionEntity } from './definition';

@Entity('execution_metrics')
@Index('idx_execution_metrics_run', ['run_id'])
@Index('idx_execution_metrics_workflow', ['workflow_id'])
@Index('idx_execution_metrics_execution_time', ['execution_time'])
@Index('idx_execution_metrics_created_at', ['created_at'])
@Index('idx_execution_metrics_trigger_type', ['trigger_type'])
export class ExecutionMetricsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  run_id!: string;

  @Column({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'uuid', nullable: false })
  version_id!: string;

  @Column({ type: 'text', nullable: true })
  trigger_type?: string;

  @Column({ type: 'int', nullable: false })
  execution_time!: number; // Total execution time in ms

  @Column({ type: 'int', nullable: true })
  queue_time?: number; // Time spent in queue before execution

  @Column({ type: 'int', nullable: false })
  step_count!: number; // Number of steps executed

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  success_rate?: number; // Percentage of successful steps

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

  @ManyToOne(() => WorkflowRunEntity)
  @JoinColumn({ name: 'run_id' })
  workflowRun?: WorkflowRunEntity;

  @ManyToOne(() => WorkflowDefinitionEntity)
  @JoinColumn({ name: 'workflow_id' })
  workflow?: WorkflowDefinitionEntity;

  @CreateDateColumn()
  created_at!: Date;
}
