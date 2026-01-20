// User Roles
const ROLES = {
  TRUCKER: 'trucker',
  DISPATCHER: 'dispatcher',
  SHIPPER: 'shipper',
  SERVICE_PROVIDER: 'service_provider',
  ADMIN: 'admin'
};

// Job Statuses
const JOB_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Bid Statuses
const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

// Notification Types
const NOTIFICATION_TYPES = {
  BID_RECEIVED: 'bid_received',
  BID_ACCEPTED: 'bid_accepted',
  BID_REJECTED: 'bid_rejected',
  JOB_ASSIGNED: 'job_assigned',
  JOB_COMPLETED: 'job_completed',
  JOB_CANCELLED: 'job_cancelled',
  RATING_RECEIVED: 'rating_received',
  SYSTEM: 'system'
};

// Cargo Types
const CARGO_TYPES = {
  DRY_VAN: 'dry_van',
  REFRIGERATED: 'refrigerated',
  FLATBED: 'flatbed',
  TANKER: 'tanker',
  CONTAINER: 'container',
  HEAVY_EQUIPMENT: 'heavy_equipment',
  HAZMAT: 'hazmat',
  AUTO_TRANSPORT: 'auto_transport'
};

module.exports = {
  ROLES,
  JOB_STATUS,
  BID_STATUS,
  NOTIFICATION_TYPES,
  CARGO_TYPES
};
