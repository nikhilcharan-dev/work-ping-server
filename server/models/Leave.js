import mongoose from "mongoose"
const leaveSchema = new mongoose.Schema({
  dates: { type: Date },
  status: { type: String },
  appliedBy: { type: mongoose.Schema.Types.ObjectId , ref : 'User' },
  approvedBy: {  type : mongoose.Schema.Types.ObjectId , ref : 'User' },
  reason: { type: String }
});
export default mongoose.model("Leave", leaveSchema);
