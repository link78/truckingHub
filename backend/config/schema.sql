-- TruckingHub Database Schema
-- PostgreSQL Database Schema for Authentication and User Management

-- Create ENUM type for user roles
CREATE TYPE user_role AS ENUM ('trucker', 'dispatcher', 'shipper', 'service_provider');

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL,
    company_name VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    bio TEXT,
    profile_picture_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expiry TIMESTAMP,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_ratings INTEGER DEFAULT 0,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for filtered queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Token Blacklist Table (for logout functionality)
CREATE TABLE IF NOT EXISTS token_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO users (name, email, password_hash, phone, role, company_name, city, state, country, verified)
-- VALUES 
--     ('John Trucker', 'trucker@test.com', '$2b$10$...', '+1-555-0101', 'trucker', 'Smith Trucking', 'Los Angeles', 'CA', 'USA', true),
--     ('Jane Shipper', 'shipper@test.com', '$2b$10$...', '+1-555-0102', 'shipper', 'Acme Shipping', 'New York', 'NY', 'USA', true);
