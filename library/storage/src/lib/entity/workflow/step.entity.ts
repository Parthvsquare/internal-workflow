// Table "workflow_step" {
//   "id" UUID [pk]
//   "version_id" UUID
//   "kind" TEXT
//   "action_key" TEXT
//   "cfg" JSONB
//   "name" TEXT
// }
// ALTER TABLE "workflow_step" ADD COLUMN "credential_id" UUID REFERENCES "user_credentials"("id");
// ALTER TABLE "workflow_step" ADD COLUMN "resource" TEXT; -- For resource/operation pattern
// ALTER TABLE "workflow_step" ADD COLUMN "operation" TEXT;
// ALTER TABLE "workflow_step" ADD COLUMN "display_options" JSONB; -- Show/hide conditions

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

  @Column({ type: 'string' })
  versionId!: string;

  @Column({ type: 'text' })
  kind!: string;

  @Column({ type: 'text' })
  actionKey!: string;

  @Column({ type: 'jsonb' })
  cfg!: Record<string, any>;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'uuid' })
  credentialId!: string;

  @ManyToOne('WorkflowUserCredentialEntity')
  @JoinColumn({ name: 'credential_id' })
  credential?: any;

  @Column({ type: 'text' })
  resource!: string;

  @Column({ type: 'text' })
  operation!: string;

  @Column({ type: 'jsonb' })
  displayOptions!: Record<string, any>;
}
