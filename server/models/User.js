import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String , required : true },
  phone: { type: String, unique: true, },
  dob: { type: Date },
  address: { type: String },
  gender: { type: String, },
  date_of_joining: { type: Date },
  role: { type: String }, 
  team_id: { type : mongoose.Schema.Types.ObjectId, ref : 'Team' },
});

export default mongoose.model("User" , UserSchema)