-- MIRROR PROFESSIONAL DATABASE SCHEMA
-- PostgreSQL schema for luxury B2B matchmaking platform

-- Matchmaker accounts (the customers)
CREATE TABLE IF NOT EXISTS matchmakers (
    matchmaker_id UUID PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Subscription details
    subscription_tier VARCHAR(20) NOT NULL CHECK (subscription_tier IN ('platinum', 'elite', 'bespoke')),
    monthly_price INTEGER NOT NULL, -- in cents
    assessment_limit INTEGER, -- NULL = unlimited
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    subscription_status VARCHAR(20) DEFAULT 'active',
    
    -- White-label branding
    custom_domain VARCHAR(255),
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    company_url VARCHAR(500),
    
    -- Usage tracking
    assessments_this_month INTEGER DEFAULT 0,
    assessments_total INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP
);

-- Client assessments (matchmaker's clients)
CREATE TABLE IF NOT EXISTS client_assessments (
    assessment_id UUID PRIMARY KEY,
    matchmaker_id UUID NOT NULL REFERENCES matchmakers(matchmaker_id) ON DELETE CASCADE,
    
    -- Client information (minimal for privacy)
    client_code VARCHAR(50), -- Matchmaker's internal ID
    client_email VARCHAR(255) NOT NULL,
    client_first_name VARCHAR(100),
    
    -- Assessment access
    magic_link_token VARCHAR(100) UNIQUE NOT NULL,
    invitation_sent_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Mirror Protocol phases
    phase1_complete BOOLEAN DEFAULT FALSE,
    phase2_complete BOOLEAN DEFAULT FALSE,
    phase3_complete BOOLEAN DEFAULT FALSE,
    phase4_complete BOOLEAN DEFAULT FALSE,
    
    -- Phase data (stored as JSONB for flexibility)
    phase1_data JSONB,
    phase2_data JSONB,
    phase3_data JSONB,
    phase4_data JSONB,
    
    -- Computed results from AI analysis
    attachment_style VARCHAR(50),
    primary_role_tendency VARCHAR(50),
    trauma_load_score INTEGER CHECK (trauma_load_score BETWEEN 0 AND 100),
    regulation_capacity INTEGER CHECK (regulation_capacity BETWEEN 0 AND 100),
    growth_readiness INTEGER CHECK (growth_readiness BETWEEN 0 AND 100),
    pattern_summary TEXT,
    blind_spots TEXT[],
    growth_edges TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Compatibility reports
CREATE TABLE IF NOT EXISTS compatibility_reports (
    report_id UUID PRIMARY KEY,
    matchmaker_id UUID NOT NULL REFERENCES matchmakers(matchmaker_id) ON DELETE CASCADE,
    client_a_id UUID NOT NULL REFERENCES client_assessments(assessment_id) ON DELETE CASCADE,
    client_b_id UUID NOT NULL REFERENCES client_assessments(assessment_id) ON DELETE CASCADE,
    
    -- Dyad Engine results
    predicted_role_lock VARCHAR(50),
    activation_probability INTEGER CHECK (activation_probability BETWEEN 0 AND 100),
    risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
    growth_potential INTEGER CHECK (growth_potential BETWEEN 0 AND 100),
    
    -- Compatibility breakdown
    surface_score INTEGER CHECK (surface_score BETWEEN 0 AND 100),
    attachment_score INTEGER CHECK (attachment_score BETWEEN 0 AND 100),
    trauma_overlap_score INTEGER CHECK (trauma_overlap_score BETWEEN 0 AND 100),
    values_score INTEGER CHECK (values_score BETWEEN 0 AND 100),
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    
    -- Flags (stored as JSONB arrays)
    red_flags JSONB,
    yellow_flags JSONB,
    green_lights JSONB,
    
    -- Report generation
    generated_at TIMESTAMP DEFAULT NOW(),
    report_template VARCHAR(50) DEFAULT 'luxury', -- luxury, clinical, executive
    pdf_url VARCHAR(500), -- S3 link when generated
    
    -- Tracking
    viewed_by_matchmaker BOOLEAN DEFAULT FALSE,
    downloaded_count INTEGER DEFAULT 0,
    shared_with_clients BOOLEAN DEFAULT FALSE
);

-- Subscription events (for analytics and billing)
CREATE TABLE IF NOT EXISTS subscription_events (
    event_id UUID PRIMARY KEY,
    matchmaker_id UUID NOT NULL REFERENCES matchmakers(matchmaker_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- trial_start, subscribe, upgrade, downgrade, cancel, reactivate
    from_tier VARCHAR(20),
    to_tier VARCHAR(20),
    monthly_value INTEGER, -- in cents
    occurred_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Usage events (for analytics)
CREATE TABLE IF NOT EXISTS usage_events (
    event_id UUID PRIMARY KEY,
    matchmaker_id UUID NOT NULL REFERENCES matchmakers(matchmaker_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- assessment_sent, assessment_started, assessment_completed, report_generated
    assessment_id UUID REFERENCES client_assessments(assessment_id) ON DELETE SET NULL,
    report_id UUID REFERENCES compatibility_reports(report_id) ON DELETE SET NULL,
    occurred_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matchmakers_email ON matchmakers(email);
CREATE INDEX IF NOT EXISTS idx_matchmakers_active ON matchmakers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_assessments_matchmaker ON client_assessments(matchmaker_id);
CREATE INDEX IF NOT EXISTS idx_assessments_token ON client_assessments(magic_link_token);
CREATE INDEX IF NOT EXISTS idx_assessments_completed ON client_assessments(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_matchmaker ON compatibility_reports(matchmaker_id);
CREATE INDEX IF NOT EXISTS idx_events_matchmaker ON usage_events(matchmaker_id);
CREATE INDEX IF NOT EXISTS idx_events_time ON usage_events(occurred_at DESC);

-- Function to reset monthly usage (run via cron on 1st of each month)
CREATE OR REPLACE FUNCTION reset_monthly_usage() RETURNS void AS $$
BEGIN
    UPDATE matchmakers SET assessments_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional - remove in production)
INSERT INTO matchmakers (matchmaker_id, company_name, email, password_hash, subscription_tier, monthly_price, assessment_limit)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Elite Match Makers',
    'demo@elitematch.com',
    '$2b$10$rQj8JZKxLm0kVVH2YqZ8DuO9YnF.fVxB6H3BxG9uKvKxR5JjZ8LXG', -- password: demo123
    'platinum',
    499900,
    100
) ON CONFLICT (email) DO NOTHING;
