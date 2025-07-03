/* ──────────────────────────────────────────────────────────────────── */
/* Webhook Endpoint Management                                         */
/* ──────────────────────────────────────────────────────────────────── */

import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowDefinitionEntity } from './workflow-definition.entity';

@Entity('webhook_endpoint')
@Index('idx_webhook_endpoint_path', ['endpoint_path'])
@Index('idx_webhook_endpoint_workflow', ['workflow_id'])
@Index('idx_webhook_endpoint_active', ['is_active'])
export class WebhookEndpointEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'text', nullable: false })
  trigger_key!: string;

  @Column({ type: 'text', unique: true, nullable: false })
  endpoint_path!: string; // e.g., '/webhook/abc123def'

  @Column({ type: 'text', default: 'POST' })
  method!: string; // HTTP method

  @Column({ type: 'boolean', default: false })
  auth_required!: boolean;

  @Column({ type: 'text', nullable: true })
  auth_header?: string; // Expected auth header name

  @Column({ type: 'text', nullable: true })
  auth_token?: string; // Expected token value (should be encrypted)

  @Column({ type: 'text', default: 'async' })
  response_mode!: string; // 'sync', 'async', 'webhook'

  @Column({ type: 'jsonb', nullable: true })
  response_data?: Record<string, any>; // Custom response data

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_triggered?: Date;

  @Column({ type: 'int', default: 0 })
  total_calls!: number;

  @ManyToOne(() => WorkflowDefinitionEntity)
  @JoinColumn({ name: 'workflow_id' })
  workflow?: WorkflowDefinitionEntity;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
