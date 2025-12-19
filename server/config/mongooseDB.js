import mongoose from 'mongoose';

const enableConnection = async () => {
    try {
        await mongoose.connect( process.env.MONGODB_URI );
        console.log("Connected to MongoDB");
    } catch(err) {
        console.error("MongoDB connection error:", err);
    }
}

export default enableConnection;