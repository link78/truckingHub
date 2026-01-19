const pool = require('../config/database');
const User = require('../models/User');
const Job = require('../models/Job');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...\n');

    // Get role IDs
    const rolesResult = await client.query('SELECT id, name FROM roles');
    const roles = {};
    rolesResult.rows.forEach(role => {
      roles[role.name] = role.id;
    });

    console.log('Creating sample users...');
    
    // Create trucker user
    const trucker = await User.create({
      email: 'trucker@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Driver',
      phone: '555-0101',
      companyName: 'Driver Express LLC',
      roleId: roles.trucker,
      addressLine1: '123 Truck Stop Rd',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      licenseNumber: 'CDL-TX-123456',
      licenseExpiry: '2025-12-31',
      insurancePolicy: 'INS-ABC-789',
      insuranceExpiry: '2025-06-30',
      truckType: 'dry_van',
      truckCapacity: 45000
    });
    console.log('✓ Trucker created:', trucker.email);

    // Create shipper user
    const shipper = await User.create({
      email: 'shipper@example.com',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Logistics',
      phone: '555-0102',
      companyName: 'Global Shipping Co',
      roleId: roles.shipper,
      addressLine1: '456 Commerce Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001'
    });
    console.log('✓ Shipper created:', shipper.email);

    // Create dispatcher user
    const dispatcher = await User.create({
      email: 'dispatcher@example.com',
      password: 'password123',
      firstName: 'Mike',
      lastName: 'Coordinator',
      phone: '555-0103',
      companyName: 'Freight Masters Inc',
      roleId: roles.dispatcher,
      addressLine1: '789 Logistics Blvd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601'
    });
    console.log('✓ Dispatcher created:', dispatcher.email);

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      phone: '555-0104',
      companyName: 'TruckingHub',
      roleId: roles.admin,
      addressLine1: '1 Admin Plaza',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    });
    console.log('✓ Admin created:', admin.email);

    // Verify and activate users
    await User.update(trucker.id, { isVerified: true, emailVerified: true });
    await User.update(shipper.id, { isVerified: true, emailVerified: true });
    await User.update(dispatcher.id, { isVerified: true, emailVerified: true });
    await User.update(admin.id, { isVerified: true, emailVerified: true });

    console.log('\nCreating sample jobs...');

    // Create job 1
    const job1 = await Job.create({
      postedBy: shipper.id,
      title: 'Dry Goods - LA to Dallas',
      description: 'Transport 40,000 lbs of packaged consumer goods from Los Angeles to Dallas. Temperature controlled storage not required.',
      cargoType: 'dry_van',
      cargoWeight: 40000,
      cargoWeightUnit: 'lbs',
      originAddress: '1234 Warehouse St',
      originCity: 'Los Angeles',
      originState: 'CA',
      originZip: '90001',
      pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      destinationAddress: '5678 Distribution Center',
      destinationCity: 'Dallas',
      destinationState: 'TX',
      destinationZip: '75201',
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      distanceMiles: 1435,
      basePrice: 2800.00,
      priority: 'normal',
      specialInstructions: 'Please call 30 minutes before arrival for loading dock assignment.'
    });
    console.log('✓ Job 1 created:', job1.title);

    // Create job 2
    const job2 = await Job.create({
      postedBy: dispatcher.id,
      title: 'Refrigerated Produce - Seattle to Chicago',
      description: 'Fresh produce delivery requiring temperature maintained at 35-40°F throughout transport.',
      cargoType: 'refrigerated',
      cargoWeight: 38000,
      cargoWeightUnit: 'lbs',
      originAddress: '9012 Fresh Foods Ln',
      originCity: 'Seattle',
      originState: 'WA',
      originZip: '98101',
      pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      destinationAddress: '3456 Market St',
      destinationCity: 'Chicago',
      destinationState: 'IL',
      destinationZip: '60601',
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      distanceMiles: 2065,
      basePrice: 4200.00,
      priority: 'high',
      specialInstructions: 'Temperature monitoring required. Must have reefer unit certification.'
    });
    console.log('✓ Job 2 created:', job2.title);

    console.log('\nCreating sample bids...');

    // Create bid 1 for job 1
    const bid1 = await Bid.create({
      jobId: job1.id,
      truckerId: trucker.id,
      bidAmount: 2600.00,
      proposedPickupDate: job1.pickup_date,
      proposedDeliveryDate: job1.delivery_date,
      message: 'I have 10 years experience with dry goods. Can provide references. Ready to go!'
    });
    console.log('✓ Bid 1 created for Job 1');

    // Create second trucker for additional bids
    const trucker2 = await User.create({
      email: 'trucker2@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Wheeler',
      phone: '555-0105',
      companyName: 'Swift Haulers',
      roleId: roles.trucker,
      addressLine1: '321 Highway Dr',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      licenseNumber: 'CDL-AZ-654321',
      licenseExpiry: '2026-03-31',
      insurancePolicy: 'INS-XYZ-456',
      insuranceExpiry: '2025-09-30',
      truckType: 'refrigerated',
      truckCapacity: 40000
    });
    await User.update(trucker2.id, { isVerified: true, emailVerified: true });

    // Create bid 2 for job 1
    const bid2 = await Bid.create({
      jobId: job1.id,
      truckerId: trucker2.id,
      bidAmount: 2750.00,
      proposedPickupDate: job1.pickup_date,
      proposedDeliveryDate: new Date(new Date(job1.delivery_date).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      message: 'Can deliver 1 day early if needed. Clean driving record and excellent ratings.'
    });
    console.log('✓ Bid 2 created for Job 1');

    // Create bid 3 for job 2
    const bid3 = await Bid.create({
      jobId: job2.id,
      truckerId: trucker2.id,
      bidAmount: 4000.00,
      proposedPickupDate: job2.pickup_date,
      proposedDeliveryDate: job2.delivery_date,
      message: 'Reefer certified with temperature monitoring system. Have done this route many times.'
    });
    console.log('✓ Bid 3 created for Job 2');

    console.log('\nCreating sample notifications...');

    // Notification to shipper about bid received
    await Notification.create({
      userId: shipper.id,
      type: 'bid_received',
      title: 'New Bid Received',
      message: `${trucker.first_name} ${trucker.last_name} has placed a bid of $${bid1.bid_amount} on your job "${job1.title}"`,
      relatedJobId: job1.id,
      relatedBidId: bid1.id,
      relatedUserId: trucker.id
    });

    await Notification.create({
      userId: shipper.id,
      type: 'bid_received',
      title: 'New Bid Received',
      message: `${trucker2.first_name} ${trucker2.last_name} has placed a bid of $${bid2.bid_amount} on your job "${job1.title}"`,
      relatedJobId: job1.id,
      relatedBidId: bid2.id,
      relatedUserId: trucker2.id
    });

    // Notification to dispatcher about bid received
    await Notification.create({
      userId: dispatcher.id,
      type: 'bid_received',
      title: 'New Bid Received',
      message: `${trucker2.first_name} ${trucker2.last_name} has placed a bid of $${bid3.bid_amount} on your job "${job2.title}"`,
      relatedJobId: job2.id,
      relatedBidId: bid3.id,
      relatedUserId: trucker2.id
    });

    // Welcome notification for trucker
    await Notification.create({
      userId: trucker.id,
      type: 'system',
      title: 'Welcome to TruckingHub',
      message: 'Your account has been successfully created. Start bidding on jobs to grow your business!',
      relatedJobId: null,
      relatedBidId: null,
      relatedUserId: null
    });

    console.log('✓ Sample notifications created');

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nSample Users Created:');
    console.log('  Trucker: trucker@example.com / password123');
    console.log('  Shipper: shipper@example.com / password123');
    console.log('  Dispatcher: dispatcher@example.com / password123');
    console.log('  Admin: admin@example.com / password123');
    console.log('  Trucker 2: trucker2@example.com / password123');
    console.log('\nSample Data:');
    console.log('  - 5 users created');
    console.log('  - 2 jobs posted');
    console.log('  - 3 bids submitted');
    console.log('  - 4 notifications created');

  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  } finally {
    client.release();
    // Close the connection pool - this is a standalone script that exits after completion
    await pool.end();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('\n✓ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = seed;
