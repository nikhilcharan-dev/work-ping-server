import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now, required: true, index: true },
    status: {
        type: String,
        enum: ['P', 'A', 'L', 'H'],
        required: true,
    },
    reason: { type: String, },

    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", required: true },

}, { timestamps: true });

AttendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model("Attendance", AttendanceSchema);
export default Attendance;