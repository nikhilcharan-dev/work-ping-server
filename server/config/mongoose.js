import mongoose from 'mongoose';

const mongooseConfig = async () => {
    try {
        mongoose.set('autoCreate', false);
        await mongoose.connect( process.env.MONGODB_URI );
        console.log("[MongoDB] Connected");

        // Clear stale MongoDB server-side validators left by previous autoCreate
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        for (const { name } of collections) {
            if (name.startsWith('system.')) continue;
            try {
                await db.command({ collMod: name, validator: {} });
            } catch(e) {}
        }
    } catch(err) {
        console.error("MongoDB connection error:", err);
    }
}

export default mongooseConfig;