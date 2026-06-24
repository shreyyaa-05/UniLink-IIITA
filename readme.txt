PROJECT: UniLink - IIITA Community App
By: Group 10 [IIT2024134,II2024137,IIT2024141,IIT2024144]

Live Project URL: https://unilink-iiita-production.up.railway.app/

1. Project Overview
Hello! Welcome to UniLink. We built this project to solve a problem We saw on campus: we have so many different needs—finding a lost ID card, catching a ride, or borrowing a bike—but no single, trusted place to handle them.

UniLink is our solution. It's an all-in-one community hub we designed to make our campus life easier by connecting students and staff. It's a secure, real-time web app that brings everything from lost & found to ride-sharing into one place, and it's all powered by a smart AI chatbot.

2. Live Demo
(No installation needed)

Live URL: https://unilink-iiita-production.up.railway.app/

Test Account: To explore the profile page and other protected features, please use this test account I made:

Email: iit2024137@iiita.ac.in

Password: password123

3. Key Features
We designed the app to cover the most common campus needs. Here are the main modules:

The AI Chatbot .We connected the Google Gemini API directly to the app's database. This means you can ask it real questions in plain English, like:

"I lost my grey hoodie, has anyone seen it?"

"Are there any bikes for rent?"

"I need a ride to the station this weekend." The chatbot performs a real-time database search to give you a smart, relevant answer.

Find Your Stuff (Lost & Found): A simple and clean board where users can post items they've lost or items they've found, complete with descriptions and locations.

Share a Ride (Commute Pooling): A dedicated module for students to post rides they are offering (e.g., "Going to airport, 3 seats left") or to find available rides posted by others.

Rent a Bike (Vehicle Rentals): A peer-to-peer marketplace for students to list their own vehicles (bikes, scooty, etc.) for rent on campus, with daily/weekly/monthly rates.

Help Out (Blood Requests): A critical, high-visibility feature for posting and viewing urgent blood donation requests within the campus community.

Secure Login & Profile: I built a full authentication system from scratch. Users can register, log in, and manage their own profiles. The profile page shows their post history (e.g., "My Lost Items," "My Vehicles for Rent") and lets them update their details.

4. Technology Stack
Here's a look  at the technologies we used to build this project:

Backend: Node.js, Express.js (for the server and API)

Database: MongoDB (using Mongoose to model the data)

Frontend: HTML5, Tailwind CSS (via CDN), and Vanilla JavaScript

Authentication: JSON Web Tokens (JWT) for secure login sessions and bcryptjs for password hashing.

AI: Google Gemini API

Deployment: Railway (for hosting the server) & MongoDB Atlas (for the cloud database)

5. How to Run It Yourself (Local Setup)

A. What You'll Need (Pre-requisites)
Node.js (v18 or higher is recommended)

npm (which comes with Node.js)

A MongoDB Atlas account (for the free cloud database)

A Google AI Studio account (to get a free Gemini API key)

B. The .env File 
This is the most important step. The app will not start without it.

Create a new file in the root folder named .env

Copy and paste the text below into it, and fill in your own keys:

# MongoDB Database

MONGO_URI="mongodb+srv://malkhedeshreya_db_user:Shreya64@cluster0.qnamebc.mongodb.net/?appName=Cluster0"
# JSON Web Token (for login)

JWT_SECRET="this_is_my_very_secret_key_123"

# Google AI Chatbot

GEMINI_API_KEY=AIzaSyCtAUTPQ0jdT9lqiRPeglnKOonip9Qo_sw

# Nodemailer (for sending emails)

EMAIL_USER="malkhedeshreya@gmail.com"

EMAIL_PASS="uydy aodx imoh vujj"

C. Step-by-Step Instructions
Clone the Code:

git clone https://github.com/shreyyaa-05/UniLink-IIITA.git

Open the Folder:

cd UniLink

Install Packages:

npm install

Run the Server: make sure the .env file is in the same directory.

npm run dev

You're Live! Open your web browser and go to:

http://localhost:5000

6. A Quick Tour of the Code (Project Structure)


/public/: This holds all the frontend files! All the HTML, client-side JavaScript, and CSS are here.

/config/: Contains the database connection logic (db.js).

/controllers/: This is the "brains" of the backend. All the logic for handling requests (like logging in, fetching data, or talking to the chatbot) lives here.

/models/: The "blueprint" for our data. This defines the Mongoose schemas for Users, Vehicles, Lost Items, etc.

/routes/: The "signposts" for our API. This maps incoming URLs (like /api/chat) to the correct controller function.

/middleware/: Contains our "security guard" (authMiddleware.js), which protects certain routes and makes sure a user is logged in.

server.js: The main entry point that starts the entire Express server.