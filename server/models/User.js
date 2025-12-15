import mongoose from "mongoose"
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String , required : true , unique : true },
  dob: { type: Date },
  address: { type: String },
  gender: { type: String, },
  dateOfJoining: { type: Date },
  role: { type: String }, 
  teamId: { type: Number },
});

export default mongoose.model("Users" , UserSchema)
