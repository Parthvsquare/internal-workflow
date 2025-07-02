/* ──────────────────────────────────────────────────────────────────── */
/* Webhook Endpoint Management                                         */
/* ──────────────────────────────────────────────────────────────────── */
// CREATE TABLE webhook_endpoint (
//   id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   workflow_id      UUID REFERENCES workflow_definition(id) ON DELETE CASCADE,
//   trigger_key      TEXT NOT NULL,
//   endpoint_path    TEXT UNIQUE NOT NULL,           -- e.g., '/webhook/abc123def'
//   method           TEXT DEFAULT 'POST',             -- HTTP method
//   auth_required    BOOLEAN DEFAULT FALSE,
//   auth_header      TEXT,                           -- Expected auth header
//   auth_token       TEXT,                           -- Expected token value (encrypted)
//   response_mode    TEXT DEFAULT 'async',           -- 'sync', 'async', 'webhook'
//   response_data    JSONB,                          -- Custom response data
//   is_active        BOOLEAN DEFAULT TRUE,
//   last_triggered   TIMESTAMPTZ,
//   total_calls      INT DEFAULT 0,
//   created_at       TIMESTAMPTZ DEFAULT NOW(),
//   updated_at       TIMESTAMPTZ DEFAULT NOW()
// );

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
