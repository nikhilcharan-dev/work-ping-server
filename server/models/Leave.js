import mongoose from "mongoose"
const leaveSchema = new mongoose.Schema({
  dates: { type: Date },
  status: { type: String },
  applied_by: { type: mongoose.Schema.Types.ObjectId , ref : 'User' },
  approved_by: {  type : mongoose.Schema.Types.ObjectId , ref : 'User' },
  reason: { type: String }
});
export default mongoose.model("Leave", leaveSchema);
