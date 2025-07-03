import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'workflow_step' })
export class WorkflowStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'version_id' })
  version_id!: string;

  @Column({ type: 'text' })
  kind!: string;

  @Column({ type: 'text', name: 'action_key', nullable: true })
  action_key?: string;

  @Column({ type: 'jsonb', nullable: true })
  cfg?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'uuid', name: 'credential_id', nullable: true })
  credential_id?: string;

  @ManyToOne('WorkflowUserCredentialEntity')
  @JoinColumn({ name: 'credential_id' })
  credential?: any;

  @Column({ type: 'text', nullable: true })
  resource?: string;

  @Column({ type: 'text', nullable: true })
  operation?: string;

  @Column({ type: 'jsonb', name: 'display_options', nullable: true })
  display_options?: Record<string, any>;
}
