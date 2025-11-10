// seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// NOTE: Adjust paths if necessary. Assuming they are in sibling directories.
const connectDB = require('./config/db'); 
const Ride = require('./models/Ride'); 
const User = require('./models/User'); // Required for user ID reference

dotenv.config();
connectDB(); 

// --- User IDs from your provided data ---
const userIDs = {
    Shreya: '690080d6d36f1713a96077cc',
    Riya: '6902ff385e931c854fa873d3',
    SurbhiK: '690300cc50f875dc45e68143',
    Karan: '6904b76fa885d0bb8a5d3b3e',
    Aditya: '6904b76fa885d0bb8a5d3b42',
    Nisha: '6904b76fa885d0bb8a5d3b43',
    Vikram: '6904b76fa885d0bb8a5d3b41',
};

// --- Available Rides Data (Matches your Ride.js Schema) ---
const rideData = [
    {
        user: userIDs.Shreya,
        startLocation: 'IIITA Girls Hostel 1',
        endLocation: 'Civil Lines Market',
        vehicleType: 'car',
        costPerPerson: 30,
        seatsAvailable: 3,
        departureTime: new Date(Date.now() + 1000 * 60 * 60), 
        details: 'Quick trip for shopping.'
    },
    {
        user: userIDs.Karan,
        startLocation: 'Boys Hostel 4 (BH-4)',
        endLocation: 'Prayagraj Railway Station (PRYJ)',
        vehicleType: 'car',
        costPerPerson: 50,
        seatsAvailable: 2,
        departureTime: new Date(new Date().setDate(new Date().getDate() + 1) + 1000 * 60 * 60 * 8), 
        details: 'Leaving early for the station. Luggage space available.'
    },
    {
        user: userIDs.SurbhiK,
        startLocation: 'IIITA Main Gate',
        endLocation: 'J.K. Institute',
        vehicleType: 'bike',
        costPerPerson: 15,
        seatsAvailable: 1,
        departureTime: new Date(Date.now() + 1000 * 60 * 45), 
        details: 'Quick drop-off, single rider only.'
    },
    {
        user: userIDs.Nisha,
        startLocation: 'Girls Hostel 1 (GH-1)',
        endLocation: 'High Court',
        vehicleType: 'auto',
        costPerPerson: 40,
        seatsAvailable: 2,
        departureTime: new Date(new Date().setDate(new Date().getDate() + 1) + 1000 * 60 * 60 * 15), 
        details: 'Shared Auto ride. Direct route to High Court.'
    },
    {
        user: userIDs.Aditya,
        startLocation: 'IIITA Labs Area',
        endLocation: 'Airport (IXD)',
        vehicleType: 'car',
        costPerPerson: 150,
        seatsAvailable: 3,
        departureTime: new Date(new Date().setDate(new Date().getDate() + 2) + 1000 * 60 * 60 * 12),
        details: 'Urgent airport drop. Toll charges included.'
    },
    {
        user: userIDs.Vikram,
        startLocation: 'MBA Block',
        endLocation: 'Teliyarganj Market',
        vehicleType: 'car', 
        costPerPerson: 25,
        seatsAvailable: 4,
        departureTime: new Date(Date.now() + 1000 * 60 * 60 * 2), 
        details: 'Going to the market, open to pick up riders from nearby hostels.'
    },
];


const importData = async () => {
    try {
        await Ride.deleteMany(); 
        await Ride.insertMany(rideData);
        console.log('✅ Ride Data Imported Successfully! 6 rides added.');
        process.exit();
    } catch (error) {
        console.error(`❌ Error importing data: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Ride.deleteMany();
        console.log('🗑️ Ride Data Destroyed Successfully!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error destroying data: ${error.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}