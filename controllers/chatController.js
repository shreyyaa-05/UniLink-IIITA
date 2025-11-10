const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// --- Import ALL your relevant models ---
const LostFound = require("../models/LostFoundItem");
const BloodRequest = require("../models/BloodRequest");
const Ride = require("../models/Ride");
const VehicleRental = require("../models/Vehicle");

// Initialize the Google AI client
const API_KEY = process.env.GEMINI_API_KEY?.trim();
const genAI = new GoogleGenerativeAI(API_KEY);

// --- NEW HELPER FUNCTION ---
/**
 * Uses a fast AI model to analyze the user's question and extract
 * searchable keywords and the most relevant database collection.
 */
async function getSearchQuery(question) {
  try {
    // Use a fast, smart model for this classification task
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a data query assistant. Your job is to analyze the user's question
      and return a JSON object specifying which collection to search and what
      keywords to use.

      Your response MUST be ONLY a JSON object.

      The available collections are:
      - "LostFound" (for lost items, found items, hoodies, wallets, keys, etc.)
      - "BloodRequest" (for blood donations, blood types, hospital names)
      - "Ride" (for ridesharing, carpooling, destinations, start points)
      - "VehicleRental" (for renting bikes, scooters, cars)
      - "General" (for questions that don't fit, like "what is this app?" or "hello")

      Examples:
      User: "I lost my grey hoodie"
      { "collection": "LostFound", "keywords": "grey hoodie" }

      User: "Anyone seen a black wallet?"
      { "collection": "LostFound", "keywords": "black wallet" }

      User: "Need B+ blood at City Hospital"
      { "collection": "BloodRequest", "keywords": "B+ City Hospital" }

      User: "Ride from campus to downtown"
      { "collection": "Ride", "keywords": "campus downtown" }
      
      User: "How much to rent a bike?"
      { "collection": "VehicleRental", "keywords": "rent bike" }

      User: "What is your purpose?"
      { "collection": "General", "keywords": "" }

      ---
      User: "${question}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean the response to ensure it's valid JSON
    const jsonMatch = responseText.match(/{[\s\S]*}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      console.error("Failed to parse JSON from AI query helper:", responseText);
      return { collection: "General", keywords: "" };
    }
  } catch (error) {
    console.error("Error in getSearchQuery:", error);
    // Fallback in case of error
    return { collection: "General", keywords: "" };
  }
}

// --- YOUR MAIN HANDLER (HEAVILY UPDATED) ---
exports.handleChat = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    // --- STEP 1: Analyze the user's question to get keywords ---
    const searchQuery = await getSearchQuery(question);
    console.log("Search Query:", searchQuery);

    // --- STEP 2: Perform a RELEVANT database search ---
    let relevantData = [];
    if (searchQuery.collection !== "General" && searchQuery.keywords) {
      const searchRegex = new RegExp(searchQuery.keywords.split(' ').join('|'), 'i');

      switch (searchQuery.collection) {
        case "LostFound":
          // Note: For production, $text search is better. See note below.
          relevantData = await LostFound.find({
            $or: [
              { item: { $regex: searchRegex } },
              { description: { $regex: searchRegex } }
            ]
          }).limit(5);
          break;
        case "BloodRequest":
          relevantData = await BloodRequest.find({
            $or: [
              { bloodType: { $regex: searchRegex } },
              { location: { $regex: searchRegex } }
            ]
          }).limit(5);
          break;
        case "Ride":
          relevantData = await Ride.find({
            $or: [
              { start: { $regex: searchRegex } },
              { destination: { $regex: searchRegex } }
            ]
          }).limit(5);
          break;
        // ... inside handleChat
      case "VehicleRental":
        // --- THIS IS THE CORRECTED CODE ---
        relevantData = await VehicleRental.find({
          $or: [
            // Search against the 'vehicleType' field ("Bike", "Car", etc.)
            { vehicleType: { $regex: searchRegex } },
            
            // Search against the 'title' field ("Yamaha MT-15", etc.)
            { title: { $regex: searchRegex } },
            
            // (Optional but recommended) Search against the 'specs' array
            { specs: { $regex: searchRegex } }
          ]
        }).limit(5);
        break;
      }
    }

    // --- STEP 3: Build the FINAL prompt with the RELEVANT data ---
    const knowledge = fs.readFileSync(
      path.join(__dirname, "../knowledge.md"),
      "utf-8"
    );

    const prompt = `
      You are a helpful chatbot for a college community app.
      Your goal is to answer the user's question based ONLY on the
      information provided below.

      If the answer isn't in the information, say "I'm sorry, I couldn't find any information about that."

      --- START OF KNOWLEDGE BASE (FAQs) ---
      ${knowledge}
      --- END OF KNOWLEDGE BASE ---

      --- START OF LIVE APP DATA (from a database search) ---
      Here is a list of items I found in the '${searchQuery.collection}' collection 
      that match the user's query:
      ${JSON.stringify(relevantData)}
      --- END OF LIVE APP DATA ---

      USER'S QUESTION: "${question}"

      Based on all the information above, please provide a clear and friendly answer.
      If the "LIVE APP DATA" array is empty [], it means nothing matching
      the user's search was found. You should say so.
    `;

    // --- STEP 4: Stream the response (This part was good!) ---

    // 1. Set headers for a streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    // 2. Use the fast streaming model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Use generateContentStream
    const result = await model.generateContentStream(prompt);

    // 4. Loop over the stream and write chunks to the response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText); // Send the chunk to the frontend
    }

    // 5. End the response stream
    res.end();

  } catch (error) {
    console.error("Chatbot error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get an answer from the chatbot." });
    } else {
      res.end(); // End the stream if it's already started
    }
  }
};