require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');
const Job = require('./server/models/Job');
const Service = require('./server/models/Service');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Job.deleteMany({});
    await Service.deleteMany({});

    // Create users
    console.log('Creating users...');
    
    const trucker = await User.create({
      name: 'John Trucker',
      email: 'trucker@test.com',
      password: 'password123',
      role: 'trucker',
      phone: '555-0101',
      company: 'John\'s Trucking',
      truckInfo: {
        truckType: 'semi_trailer',
        capacity: 45000,
        licensePlate: 'ABC-1234',
      },
    });

    const dispatcher = await User.create({
      name: 'Jane Dispatcher',
      email: 'dispatcher@test.com',
      password: 'password123',
      role: 'dispatcher',
      phone: '555-0102',
      company: 'Global Logistics Inc',
    });

    const shipper = await User.create({
      name: 'Bob Shipper',
      email: 'shipper@test.com',
      password: 'password123',
      role: 'shipper',
      phone: '555-0103',
      company: 'Acme Shipping Co',
    });

    const serviceProvider = await User.create({
      name: 'Mike Mechanic',
      email: 'service@test.com',
      password: 'password123',
      role: 'service_provider',
      phone: '555-0104',
      company: 'Quick Fix Truck Services',
      serviceTypes: ['maintenance', 'roadside_assistance', 'tire_service'],
    });

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      phone: '555-0100',
      company: 'TruckingHub',
    });

    console.log('Users created successfully!');

    // Create sample jobs
    console.log('Creating sample jobs...');

    const job1 = await Job.create({
      title: 'Urgent Electronics Shipment - LA to NYC',
      description: 'Time-sensitive electronics shipment. Requires temperature-controlled truck.',
      postedBy: dispatcher._id,
      postedByRole: 'dispatcher',
      status: 'available',
      pickup: {
        location: 'Los Angeles, CA',
        address: '123 Warehouse St',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      },
      delivery: {
        location: 'New York, NY',
        address: '456 Distribution Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      cargo: {
        type: 'Electronics',
        weight: 15000,
        quantity: 200,
        specialRequirements: ['temperature_controlled', 'fragile'],
      },
      payment: {
        amount: 4500,
        currency: 'USD',
      },
      distance: 2789,
      estimatedDuration: 45,
      requirements: {
        truckType: 'refrigerated',
        minCapacity: 20000,
        certifications: ['hazmat'],
      },
    });

    const job2 = await Job.create({
      title: 'Furniture Delivery - Chicago to Dallas',
      description: 'Standard furniture shipment for retail store.',
      postedBy: shipper._id,
      postedByRole: 'shipper',
      status: 'available',
      pickup: {
        location: 'Chicago, IL',
        address: '789 Furniture Blvd',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      delivery: {
        location: 'Dallas, TX',
        address: '321 Retail Plaza',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      },
      cargo: {
        type: 'Furniture',
        weight: 12000,
        quantity: 50,
      },
      payment: {
        amount: 2800,
        currency: 'USD',
      },
      distance: 967,
      estimatedDuration: 16,
      requirements: {
        truckType: 'box_truck',
        minCapacity: 15000,
      },
    });

    const job3 = await Job.create({
      title: 'Construction Materials - Houston to Phoenix',
      description: 'Heavy construction materials. Flatbed required.',
      postedBy: dispatcher._id,
      postedByRole: 'dispatcher',
      status: 'claimed',
      assignedTo: trucker._id,
      pickup: {
        location: 'Houston, TX',
        address: '555 Industrial Dr',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      },
      delivery: {
        location: 'Phoenix, AZ',
        address: '888 Construction Way',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
      cargo: {
        type: 'Construction Materials',
        weight: 35000,
        quantity: 100,
        specialRequirements: ['heavy_load'],
      },
      payment: {
        amount: 3200,
        currency: 'USD',
      },
      distance: 1181,
      estimatedDuration: 18,
      requirements: {
        truckType: 'flatbed',
        minCapacity: 40000,
      },
      statusHistory: [
        {
          status: 'claimed',
          timestamp: new Date(),
          updatedBy: trucker._id,
          notes: 'Job claimed by trucker',
        },
      ],
    });

    console.log('Jobs created successfully!');

    // Create sample services
    console.log('Creating sample services...');

    const service1 = await Service.create({
      provider: serviceProvider._id,
      title: '24/7 Emergency Roadside Assistance',
      description: 'Quick response roadside assistance for trucks. Available 24/7 throughout the Southwest region.',
      category: 'roadside_assistance',
      pricing: {
        basePrice: 150,
        pricingType: 'fixed',
        currency: 'USD',
      },
      availability: {
        isAvailable: true,
        is24_7: true,
      },
      serviceArea: {
        cities: ['Phoenix', 'Las Vegas', 'Albuquerque', 'Tucson'],
        states: ['AZ', 'NV', 'NM'],
        radius: 200,
      },
      rating: 4.8,
      reviewCount: 45,
      bookings: 123,
    });

    const service2 = await Service.create({
      provider: serviceProvider._id,
      title: 'Preventive Maintenance Service',
      description: 'Complete truck maintenance including oil changes, brake inspections, and general repairs.',
      category: 'maintenance',
      pricing: {
        basePrice: 200,
        pricingType: 'hourly',
        currency: 'USD',
      },
      availability: {
        isAvailable: true,
        workingHours: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '18:00' },
          saturday: { start: '09:00', end: '14:00' },
        },
        is24_7: false,
      },
      serviceArea: {
        cities: ['Phoenix', 'Mesa', 'Scottsdale'],
        states: ['AZ'],
        radius: 50,
      },
      rating: 4.9,
      reviewCount: 67,
      bookings: 234,
    });

    console.log('Services created successfully!');

    console.log('\n=== Seed Data Created Successfully! ===');
    console.log('\nTest User Credentials:');
    console.log('Trucker: trucker@test.com / password123');
    console.log('Dispatcher: dispatcher@test.com / password123');
    console.log('Shipper: shipper@test.com / password123');
    console.log('Service Provider: service@test.com / password123');
    console.log('Admin: admin@test.com / password123');
    console.log('\n3 jobs created (2 available, 1 claimed)');
    console.log('2 services created');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
