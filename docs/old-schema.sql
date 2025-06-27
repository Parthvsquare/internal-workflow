/************************************\*************************************

- COMPLETE POSTGRES SCHEMA FOR THE WORKFLOW ENGINE (v 2 – branching)
  ************************************\*************************************/

/_ uuid v7 will be used _/

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 1. Mutable “container” that appears in the UI _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE workflow_definition (
id UUID PRIMARY KEY,
name TEXT NOT NULL,
segment TEXT CHECK (segment IN ('CRM','SALES','MARKETING')),
latest_ver_id UUID, -- FK added after version table
is_active BOOLEAN DEFAULT TRUE,
created_by UUID,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 2. Immutable versions (JSON copy stored inline + S3 pointer) _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE workflow_version (
id UUID PRIMARY KEY,
workflow_id UUID REFERENCES workflow_definition(id) ON DELETE CASCADE,
version_num INT NOT NULL,
s3_key TEXT NOT NULL, -- e.g. s3://wf/<id>/v2.json
s3_etag TEXT,
inline_json JSONB, -- NULL ⇒ fetch from S3
root_step_id UUID, -- filled after first step insert
editor_id UUID,
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE (workflow_id, version_num)
);

/_ back-reference from definition → latest version _/
ALTER TABLE workflow_definition
ADD CONSTRAINT fk_latest_version
FOREIGN KEY (latest_ver_id) REFERENCES workflow_version(id);

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 3. Trigger configuration per version _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE workflow_trigger (
id UUID PRIMARY KEY,
version_id UUID REFERENCES workflow_version(id) ON DELETE CASCADE,
trigger_key TEXT NOT NULL, -- e.g. opportunity.updated
filters JSONB
);

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 4. Static catalogue of actions (managed by developers) _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE workflow_action (
key TEXT PRIMARY KEY, -- marketing.enqueue-email
description TEXT,
params_json_schema JSONB
);
/\*
Developers publish a static row in workflow_action (the catalogue).

INSERT INTO workflow_action (key, description, params_json_schema)
VALUES (
'crm.update-record',
'Patch any CRM entity',
'{
"$id":"crm.update-record",
"type":"object",
"required":["record_type","patch"],
"properties":{
"record_type":{"enum":["opportunity","contact","lead"]},
"patch":{"type":"object","minProperties":1}
}
}'::jsonb
);
\*/

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 5. Workflow graph (nodes & edges) _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE workflow_step (
id UUID PRIMARY KEY,
version_id UUID REFERENCES workflow_version(id) ON DELETE CASCADE,
kind TEXT CHECK
(kind IN ('ACTION','CONDITION','DELAY','LOOP')),
action_key TEXT REFERENCES workflow_action(key), -- NULL for CONDITION
cfg JSONB, -- params / expression
name TEXT -- label in builder UI
);

ALTER TABLE workflow_version
ADD CONSTRAINT fk_root_step
FOREIGN KEY (root_step_id) REFERENCES workflow_step(id);

/_ directed edge; branch_key distinguishes TRUE/FALSE/DEFAULT/etc. _/
CREATE TABLE workflow_edge (
from_step_id UUID REFERENCES workflow_step(id) ON DELETE CASCADE,
to_step_id UUID REFERENCES workflow_step(id),
branch_key TEXT DEFAULT 'default',
PRIMARY KEY (from_step_id, branch_key)
);

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 6. Runtime: one row per trigger firing _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE workflow_run (
id UUID PRIMARY KEY,
workflow_id UUID REFERENCES workflow_definition(id),
version_id UUID REFERENCES workflow_version(id),
trigger_event_id TEXT, -- Kafka offset / UUID
status TEXT CHECK
(status IN ('PENDING','SUCCESS','FAILED')),
started_at TIMESTAMPTZ,
ended_at TIMESTAMPTZ,
fail_reason TEXT
);

CREATE INDEX idx_run_status ON workflow_run (status);
CREATE INDEX idx_run_started_at ON workflow_run (started_at);

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 7. Runtime: each executed step _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE step_run (
run_id UUID REFERENCES workflow_run(id) ON DELETE CASCADE,
step_id UUID REFERENCES workflow_step(id),
status TEXT CHECK
(status IN ('PENDING','SUCCESS','FAILED','SKIPPED')),
started_at TIMESTAMPTZ,
ended_at TIMESTAMPTZ,
idempotency_key TEXT,
PRIMARY KEY (run_id, step_id)
);

CREATE INDEX idx_step_status ON step_run (status);

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 8. Fine-grained log lines (optional time-based partition later) _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE execution_log (
id BIGSERIAL PRIMARY KEY,
run_id UUID REFERENCES workflow_run(id) ON DELETE CASCADE,
step_id UUID,
level TEXT CHECK (level IN ('DEBUG','INFO','WARN','ERROR')),
message TEXT,
ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_run ON execution_log (run_id);
CREATE INDEX idx_log_ts ON execution_log (ts);

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 9. Daily roll-up metrics (populated by batch or streaming job) _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE TABLE daily_workflow_metrics (
workflow_id UUID,
version_id UUID,
day DATE,
total_runs INT,
success_runs INT,
failed_runs INT,
avg_latency_ms NUMERIC,
bounce_rate NUMERIC,
PRIMARY KEY (workflow_id, day)
);

/_ ──────────────────────────────────────────────────────────────────── _/
/_ 10. Convenience VIEW: always give latest JSON definition _/
/_ ──────────────────────────────────────────────────────────────────── _/
CREATE VIEW workflow_latest_json AS
SELECT d.id AS workflow_id,
v.version_num,
COALESCE(v.inline_json, -- fast path
pg_read_file('placeholder')) AS definition_json
FROM workflow_definition d
JOIN workflow_version v ON v.id = d.latest_ver_id
WHERE d.is_active = TRUE;

/_ Replace pg_read_file(...) with a small SECURITY DEFINER function
that fetches from S3 if inline_json IS NULL and caches the result.
_/

-- ## DATABASE SCHEMA (PostgreSQL, simplified)

-- 1. Entity-relationship view

-- ---

-- 1. workflow_definition – logical “flow” visible in the UI
-- 2. workflow_version – immutable edits of a flow (one row per save)
-- 3. workflow_trigger – the trigger segment (optional: many per version if you later add “OR” triggers)
-- 4. workflow_action – the action catalog (static, filled by devs; referenced by step_run)
-- 5. workflow_run – one instance created every time a trigger fires
-- 6. step_run – one row per action step executed inside a run
-- 7. execution_log – append-only log messages / stack traces tied to step_run
-- 8. daily_workflow_metrics – materialised roll-up (can be a view if you use ClickHouse/OLAP)