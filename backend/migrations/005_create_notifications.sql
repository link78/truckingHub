-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  related_job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  related_bid_id INTEGER REFERENCES bids(id) ON DELETE CASCADE,
  related_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_notification_type CHECK (type IN (
    'bid_received', 'bid_accepted', 'bid_rejected',
    'job_assigned', 'job_completed', 'job_cancelled',
    'rating_received', 'system'
  ))
);

-- Create index for faster user notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
