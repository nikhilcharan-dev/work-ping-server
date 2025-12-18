<<<<<<< Updated upstream
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
  teamId: { type : Schema.Types.ObjectId, ref : 'Team' },
});

export default mongoose.model("User" , UserSchema)
=======
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    verified: Boolean,
    email: {
        type: String,
        required: true,
        unique: true
    },
    dob: Date,
    phone: String,
    gender: String,
    date_of_join: Date,
    status: String,
    salary: String,
});

const User = mongoose.model('User', UserSchema);
export default User;
>>>>>>> Stashed changes
