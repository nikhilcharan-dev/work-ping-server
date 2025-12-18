<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    start_time: Date,
    end_time: Date,
})

const Shift = mongoose.model('Shift', ShiftSchema);
<<<<<<< Updated upstream
export default Shift;
>>>>>>> Stashed changes
=======
export default Shift;
>>>>>>> Stashed changes
