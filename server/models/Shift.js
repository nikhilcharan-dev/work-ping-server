import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    start_time: Date,
    end_time: Date,
})

const Shift = mongoose.model('Shift', ShiftSchema);