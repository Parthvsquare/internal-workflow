```sql
-- Lead statuses table
CREATE TABLE lead_statuses (
code VARCHAR(50) PRIMARY KEY,
name VARCHAR(100) NOT NULL,
is_active BOOLEAN DEFAULT true,
sort_order INTEGER DEFAULT 0
);

INSERT INTO lead_statuses VALUES
('new', 'New', true, 1),
('contacted', 'Contacted', true, 2),
('qualified', 'Qualified', true, 3),
('proposal', 'Proposal', true, 4),
('negotiation', 'Negotiation', true, 5),
('closed_won', 'Closed Won', true, 6),
('closed_lost', 'Closed Lost', true, 7);

-- Lead sources table
CREATE TABLE lead_sources (
code VARCHAR(50) PRIMARY KEY,
name VARCHAR(100) NOT NULL,
is_active BOOLEAN DEFAULT true,
display_order INTEGER DEFAULT 0
);

INSERT INTO lead_sources VALUES
('website', 'Website', true, 1),
('referral', 'Referral', true, 2),
('email_campaign', 'Email Campaign', true, 3),
('social_media', 'Social Media', true, 4),
('cold_call', 'Cold Call', true, 5);

-- Users table (if not exists)
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
full_name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
role VARCHAR(50) NOT NULL,
is_active BOOLEAN DEFAULT true
);
```
