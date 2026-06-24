const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config(); // Load .env variables




const connectDB = async () => {
    try {
        // We removed the deprecated options
        console.log(process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected... 💾`);

    } catch (err) {
        console.error('Database Connection FAILED');
        console.error(err.message);
        process.exit(1); 
    }
};

module.exports = connectDB;