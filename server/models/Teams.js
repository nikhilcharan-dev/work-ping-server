import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema({
    org_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: String,
    members: [mongoose.Schema.Types.ObjectId],
    team_manager: { type: mongoose.Schema.Types.ObjectId, required: true },
})

const Team = mongoose.model('Team', TeamSchema);
export default Team;