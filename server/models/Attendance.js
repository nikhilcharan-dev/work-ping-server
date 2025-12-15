import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  status: { type: String, required: true },
  userId: { type : Schema.Types.ObjectId, ref: "User" }
});

export default mongoose.model("Attendance", attendanceSchema);