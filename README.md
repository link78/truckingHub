# TruckHub MVP Phase 1 Load Marketplace

## Project Overview
TruckHub is a load marketplace that connects shippers and carriers in real time, facilitating efficient transportation of goods across various locations.

## Features
- User Authentication: Secure login and registration for shippers and carriers.
- Load Listings: Real-time posting and searching of available loads.
- Bidding System: Carriers can bid on loads, increasing competition and lowering costs.
- Ratings and Reviews: Users can rate each other to maintain a high-quality marketplace.

## Tech Stack
- **Front-end:** React.js
- **Back-end:** Node.js, Express.js
- **Database:** MongoDB
- **Real-time:** Socket.IO

## Quick Start Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/link78/truckingHub.git
   cd truckingHub
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Access the application at `http://localhost:3000`.

## Project Structure
- `/client`: Contains front-end code.
- `/server`: Contains back-end code.
- `/models`: Database models.
- `/routes`: API endpoints.

## API Endpoints
- `GET /api/loads`: Retrieve all available loads.
- `POST /api/loads`: Create a new load listing.
- `PUT /api/loads/:id`: Update a specific load.
- `DELETE /api/loads/:id`: Delete a specific load.

## Real-time Features
The application utilizes Socket.IO for real-time updates on load statuses, ensuring that users receive immediate notifications on their load progress and bids.