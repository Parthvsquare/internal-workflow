import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('credential_type')
@Index('idx_credential_type_key', ['id'])
export class WorkflowCredentialTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  display_name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @Column({ type: 'jsonb', default: {} })
  properties_schema?: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  test_endpoint?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  auth_type?: string;

  @Column({ type: 'simple-array', nullable: true })
  supported_actions?: string[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

// CREATE TABLE "user_credentials" (
//   "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   "user_id" UUID NOT NULL,
//   "credential_type" TEXT REFERENCES "credential_type"("name"),
//   "name" TEXT NOT NULL,
//   "encrypted_data" TEXT NOT NULL, -- Encrypted credential data
//   "is_active" BOOLEAN DEFAULT TRUE,
//   "created_at" TIMESTAMPTZ DEFAULT NOW(),
//   "updated_at" TIMESTAMPTZ DEFAULT NOW()
// );

@Entity('user_credentials')
@Index('idx_user_credentials_user_id', ['user_id'])
export class WorkflowUserCredentialEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  user_id!: string;

  @Column({ type: 'text', nullable: false })
  credential_type!: string;

  @Column({ type: 'text', nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: false })
  encrypted_data!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
