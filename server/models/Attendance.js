import mongoose from "mongoose";


const AttendanceSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now, required: true },
    status: {
        type: String,
        enum: ['P', 'A', 'L', 'H'],
        required: true,
    },
    reason: { type: String, },

    user_id: { type: mongoose.Schema.Types.ObjectId },
    manager_id: { type: mongoose.Schema.Types.ObjectId },

}, { timestamps: true });

AttendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model("Attendance", AttendanceSchema);
export default Attendance;