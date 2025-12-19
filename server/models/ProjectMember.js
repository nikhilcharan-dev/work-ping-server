import mongoose from 'mongoose';

const ProjectMemberSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId },

})