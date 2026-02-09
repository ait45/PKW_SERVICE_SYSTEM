import mongoose from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI in .env");
}
let isConnected = null;
export const MongoDBConnection = async () => {
    if (isConnected)
        return;
    try {
        const db = await mongoose.connect(MONGODB_URI);
        isConnected = db.connections[0].readyState;
    }
    catch (error) {
        console.log("Database Connection failed : ", error);
    }
};
