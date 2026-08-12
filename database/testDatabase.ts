import mongoose from "mongoose";
console.log("Test Connection Database with connection string:", process.env.MONGODB_URI!);
export async function testDatabase(): Promise<void> {
    const connectionString = "mongodb://127.0.0.1:27017/PKW_Service_DB?authSource=admin";
    if (!connectionString) console.log("MONGODB_URI is not defined in the environment variables.");
    console.log("Test Connection Database with connection string:", connectionString);
    await mongoose.connect(connectionString!).then(() => {
        console.log("Connected to MongoDB");
    }).catch((error) => {
        console.error("Error connecting to the database:", error);
    });
}
testDatabase();