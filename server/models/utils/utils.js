import mongoose from "mongoose";

export const bioDataSchema = new mongoose.Schema({
    name: { type: String, required: true, },
    email: { type: String, required: true, unique: true },
    gender: { type: String, required: true, },
});

export const credentialsSchema = new mongoose.Schema({
    password: { type: String, required: true },
    verified: { type: Boolean, default: false},
});