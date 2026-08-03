-- Factory OS Database Schema (PostgreSQL)

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'admin', 'manager', 'operator'
    factory_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization Hierarchy
CREATE TABLE factories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    manufacturer VARCHAR(255),
    installation_date DATE,
    last_maintenance TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'operational', -- 'operational', 'down', 'maintenance'
    metadata JSONB
);

-- Operational Data
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id),
    name VARCHAR(255) NOT NULL,
    shift_pattern VARCHAR(100),
    skills TEXT[]
);

CREATE TABLE production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    operator_id UUID REFERENCES operators(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    units_produced INTEGER DEFAULT 0,
    units_defective INTEGER DEFAULT 0,
    downtime_minutes INTEGER DEFAULT 0,
    downtime_reason TEXT,
    cycle_time_seconds FLOAT
);

CREATE TABLE maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50), -- 'planned', 'unplanned'
    description TEXT,
    cost DECIMAL(12, 2),
    duration_hours FLOAT,
    performed_by VARCHAR(255)
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id),
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 10,
    unit_cost DECIMAL(12, 2),
    last_restocked TIMESTAMP WITH TIME ZONE
);

CREATE TABLE quality_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    batch_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    parameters JSONB, -- { "temp": 85, "pressure": 120, ... }
    status VARCHAR(50), -- 'pass', 'fail', 'rework'
    defect_type VARCHAR(100)
);

-- AI and Analytics
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    severity VARCHAR(20), -- 'critical', 'warning', 'info'
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    confidence_score FLOAT,
    impact_analysis JSONB, -- { "oee_improvement": "5%", "cost_savings": "$1000" }
    agent_id VARCHAR(100), -- 'maintenance_agent', 'production_agent'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id),
    metric VARCHAR(100), -- 'failure_probability', 'remaining_useful_life'
    predicted_value FLOAT,
    target_date DATE,
    shap_values JSONB, -- For Explainable AI
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Interaction
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    agent_metadata JSONB, -- Which agents were involved
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES factories(id),
    key TEXT NOT NULL,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
