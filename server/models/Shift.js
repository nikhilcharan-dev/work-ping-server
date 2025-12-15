import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
  startTime: { type: String },
  endTime: { type: String },
  date: { type: Date },
  slotStart: { type: Number },
  slotEnd: { type: Number },
  breakMinutes: { type: Number },
});

export default mongoose.model("Shift", shiftSchema);
