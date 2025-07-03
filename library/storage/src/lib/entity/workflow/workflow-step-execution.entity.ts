import {
  Column,
  Entity,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('step_execution')
@Index('idx_step_execution_status', ['status'])
@Index('idx_step_run_execution_time', ['execution_time'])
@Index('idx_step_execution_started_at', ['started_at'])
export class StepExecutionEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  run_id!: string;

  @PrimaryColumn({ type: 'uuid', nullable: false })
  step_id!: string;

  @Column({ type: 'text', nullable: true })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  ended_at?: Date;

  @Column({ type: 'int', nullable: true })
  execution_time?: number; // Duration in milliseconds

  @Column({ type: 'jsonb', nullable: true })
  result_data?: Record<string, any>; // Step execution result

  @Column({ type: 'text', nullable: true })
  error_message?: string; // Error message if failed

  @Column({ type: 'text', nullable: true })
  error_stack?: string; // Full error stack trace

  @Column({ type: 'int', default: 0 })
  retry_count!: number; // Number of retries attempted

  @Column({ type: 'int', default: 0 })
  max_retries!: number; // Max allowed retries for this step

  @Column({ type: 'jsonb', nullable: true })
  input_data?: Record<string, any>; // Input data for debugging

  @Column({ type: 'jsonb', nullable: true })
  output_data?: Record<string, any>; // Output data for next steps

  @Column({ type: 'text', nullable: true })
  idempotency_key?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
