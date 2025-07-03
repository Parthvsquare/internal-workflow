-- Create lead_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_sources (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test 1: Insert a new lead source (should trigger INSERT event)
INSERT INTO lead_sources (code, name, is_active, display_order) 
VALUES ('test_social', 'Test Social Media', true, 10)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    updated_at = NOW();

-- Test 2: Update the lead source (should trigger UPDATE event)
UPDATE lead_sources 
SET name = 'Updated Social Media Campaign', 
    display_order = 5,
    updated_at = NOW()
WHERE code = 'test_social';

-- Test 3: Deactivate the lead source (should trigger UPDATE event)
UPDATE lead_sources 
SET is_active = false,
    updated_at = NOW()
WHERE code = 'test_social';

-- Test 4: Reactivate the lead source (should trigger UPDATE event)
UPDATE lead_sources 
SET is_active = true,
    updated_at = NOW()
WHERE code = 'test_social';

-- Test 5: Delete the lead source (should trigger DELETE event)
-- DELETE FROM lead_sources WHERE code = 'test_social';

-- View current lead sources
SELECT * FROM lead_sources ORDER BY display_order; 