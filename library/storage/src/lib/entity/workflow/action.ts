// CREATE TABLE workflow_action (
//   key                 TEXT PRIMARY KEY,   -- marketing.enqueue-email
//   description         TEXT,
//   params_json_schema  JSONB
// );

import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('workflow_action')
@Index('idx_workflow_action_key', ['key'])
export class WorkflowActionEntity {
  @PrimaryColumn({ type: 'text', nullable: false })
  key!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  params_json_schema?: Record<string, any>;
}
