/* ──────────────────────────────────────────────────────────────────── */
/* 10. Convenience VIEW: always give latest JSON definition            */
/* ──────────────────────────────────────────────────────────────────── */

import { Column, PrimaryColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `
      SELECT d.id                       AS workflow_id,
        v.version_num,
        COALESCE(v.inline_json,    -- fast path
                  pg_read_file('placeholder')::jsonb) AS definition_json
      FROM   workflow_definition d
      JOIN   workflow_version    v ON v.id = d.latest_ver_id
      WHERE  d.is_active = TRUE;
  `,
})
export class WorkflowLatestJsonEntity {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  workflow_id!: string;

  @Column({ type: 'int', nullable: false })
  version_num!: number;

  @Column({ type: 'jsonb', nullable: true })
  definition_json?: Record<string, any>;
}
