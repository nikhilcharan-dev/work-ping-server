import mongoose from "mongoose"
const leaveSchema = new mongoose.Schema({
  dates: { type: Date },
  status: { type: String },
  appliedBy: { type: Number },
  approvedBy: {  type : Number },
  reason: { type: String }
});
export default mongoose.model("Leave", leaveSchema);