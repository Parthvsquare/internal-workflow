/* ──────────────────────────────────────────────────────────────────── */
/* 2.  Immutable versions (JSON copy stored inline + S3 pointer)       */
/* ──────────────────────────────────────────────────────────────────── */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowDefinitionEntity } from './workflow-definition.entity';
import { WorkflowStepEntity } from './workflow-step.entity';

@Entity('workflow_version')
@Index('idx_workflow_version_key', ['workflow_id', 'version_num'])
export class WorkflowVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'int', nullable: false })
  version_num!: number;

  @Column({ type: 'text', nullable: false })
  s3_key!: string;

  @Column({ type: 'text', nullable: true })
  s3_etag?: string;

  @Column({ type: 'jsonb', nullable: true })
  inline_json?: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  root_step_id?: string;

  @Column({ type: 'uuid', nullable: true })
  editor_id?: string;

  @ManyToOne(() => WorkflowStepEntity)
  @JoinColumn({ name: 'root_step_id' })
  rootStep?: WorkflowStepEntity;

  @OneToMany(
    () => WorkflowDefinitionEntity,
    (definition) => definition.latestVersion
  )
  definitions?: WorkflowDefinitionEntity[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
