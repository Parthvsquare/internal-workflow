import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkflowStepEntity } from './step.entity';

@Entity('workflow_edge')
@Index('idx_workflow_edge_from_step', ['from_step_id'])
export class WorkflowEdgeEntity {
  @PrimaryColumn({ type: 'uuid' })
  from_step_id!: string;

  @PrimaryColumn({ type: 'text', default: 'default' })
  branch_key!: string;

  @Column({ type: 'uuid', nullable: true })
  to_step_id?: string;

  @ManyToOne(() => WorkflowStepEntity)
  @JoinColumn({ name: 'from_step_id' })
  fromStep?: WorkflowStepEntity;

  @ManyToOne(() => WorkflowStepEntity)
  @JoinColumn({ name: 'to_step_id' })
  toStep?: WorkflowStepEntity;
}
