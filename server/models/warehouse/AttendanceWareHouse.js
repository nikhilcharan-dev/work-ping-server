import mongoose from "mongoose";

const AttendanceWareHouseSchema = new mongoose.Schema({
    month: { type: String, required: true },
    records: [{
        status: { type: String, enum: ['P', 'A', 'L', 'H'] },
        reason: { type: String, }
    }],

    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", required: true },
}, { timestamps: true });

AttendanceWareHouseSchema.index({ employee_id: 1, month: 1 }, { unique: true });
const AttendanceWareHouse = mongoose.model("AttendanceWareHouse", AttendanceWareHouseSchema);
export default AttendanceWareHouse;