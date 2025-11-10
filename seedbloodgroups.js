const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if your models are elsewhere
require('dotenv').config(); // To read your .env file

// --- Configuration ---

// The list of valid blood groups to randomly assign
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Get your database connection string from your .env file
const DB_URI = process.env.MONGO_URI;

// --- Helper Function ---
/**
 * Gets a random item from an array.
 * @param {Array} arr - The array to pick from
 * @returns {*} A random item from the array
 */
const getRandomItem = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
};


// --- Main Seeder Function ---
const populateBloodGroups = async () => {
    if (!DB_URI) {
        console.error('Error: MONGO_URI not found in .env file.');
        console.log('Please make sure your .env file is set up correctly.');
        process.exit(1);
    }

    try {
        // 1. Connect to the database
        await mongoose.connect(DB_URI);
        console.log('✅ Database connected.');

        // 2. Find all users (we only need their IDs)
        const users = await User.find({}, '_id');
        
        if (users.length === 0) {
            console.log('No users found in the database. Exiting.');
            return;
        }

        console.log(`Found ${users.length} users. Preparing bulk update...`);

        // 3. Create a bulk update operation for each user
        const bulkOps = users.map(user => {
            return {
                updateOne: {
                    filter: { _id: user._id },
                    update: { 
                        $set: { bloodGroup: getRandomItem(bloodGroups) } 
                    }
                }
            };
        });

        // 4. Execute the bulk write operation
        console.log('Sending bulk update to MongoDB...');
        const result = await User.bulkWrite(bulkOps);

        console.log('--- 🎉 Update Complete! ---');
        console.log(`Successfully modified ${result.modifiedCount} user documents.`);


    } catch (err) {
        console.error('An error occurred during the seeding process:');
        console.error(err);
    } finally {
        // 5. Always disconnect from the DB
        await mongoose.disconnect();
        console.log('Database disconnected.');
    }
};

// 6. Run the script
populateBloodGroups();