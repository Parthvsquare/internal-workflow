-- Migration to fix workflow_trigger_registry key column
-- This script handles existing null values and ensures proper constraints

-- Step 1: Update null key values with proper identifiers
UPDATE workflow_trigger_registry 
SET key = CASE 
    WHEN name = 'lead_database_change' THEN 'lead_database_change'
    WHEN name LIKE '%webhook%' THEN LOWER(REPLACE(name, ' ', '_'))
    WHEN name LIKE '%database%' THEN LOWER(REPLACE(name, ' ', '_'))
    ELSE LOWER(REPLACE(REPLACE(name, ' ', '_'), '-', '_'))
END
WHERE key IS NULL OR key = '';

-- Step 2: Ensure all keys are unique by adding a suffix if needed
WITH duplicate_keys AS (
    SELECT key, ROW_NUMBER() OVER (PARTITION BY key ORDER BY created_at) as row_num
    FROM workflow_trigger_registry
    WHERE key IS NOT NULL
)
UPDATE workflow_trigger_registry 
SET key = workflow_trigger_registry.key || '_' || (duplicate_keys.row_num - 1)
FROM duplicate_keys 
WHERE workflow_trigger_registry.key = duplicate_keys.key 
    AND duplicate_keys.row_num > 1;

-- Step 3: Add the NOT NULL constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_trigger_registry_key_not_null' 
        AND table_name = 'workflow_trigger_registry'
    ) THEN
        ALTER TABLE workflow_trigger_registry 
        ALTER COLUMN key SET NOT NULL;
    END IF;
END $$;

-- Step 4: Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'UQ_workflow_trigger_registry_key' 
        AND table_name = 'workflow_trigger_registry'
    ) THEN
        ALTER TABLE workflow_trigger_registry 
        ADD CONSTRAINT UQ_workflow_trigger_registry_key UNIQUE (key);
    END IF;
END $$; 