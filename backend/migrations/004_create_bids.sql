-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  trucker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Bid details
  bid_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  proposed_pickup_date DATE,
  proposed_delivery_date DATE,
  message TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT positive_bid CHECK (bid_amount >= 0),
  CONSTRAINT valid_bid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  CONSTRAINT unique_active_bid UNIQUE (job_id, trucker_id)
);

-- Create trigger for bids table
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
