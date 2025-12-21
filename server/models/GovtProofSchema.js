import mongoose from "mongoose";

const govtProofSchema = new mongoose.Schema({
  aadhaar: { type: String , required : true },
  passport: { type: String },
  pan: { type: String , required : true },
  bank: { type: String , required : true }
});

export default mongoose.model("GovtProfSchema" , govtProofSchema);