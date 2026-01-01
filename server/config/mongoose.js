import mongoose from 'mongoose';

const mongooseConfig = async () => {
    try {
        await mongoose.connect( process.env.MONGODB_URI );
        console.log("[MongoDB] Connected");
    } catch(err) {
        console.error("MongoDB connection error:", err);
    }
}

export default mongooseConfig;