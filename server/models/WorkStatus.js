import mongoose from 'mongoose';

const WorkStatusSchema = mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    project_id: mongoose.Schema.Types.ObjectId,
    is_remote: Boolean,
    date: Date,
    status: String,
})

const WorkStatus = mongoose.model('WorkStatus', WorkStatusSchema);
export default WorkStatus;