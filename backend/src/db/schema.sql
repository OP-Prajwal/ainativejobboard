CREATE TABLE IF NOT EXISTS installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID NOT NULL UNIQUE,
    domain VARCHAR(255),
    installation_token TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, revoked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_installations_lookup ON installations(installation_id);
