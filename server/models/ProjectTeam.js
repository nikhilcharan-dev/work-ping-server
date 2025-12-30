
import mongoose from "mongoose"

const projectTeamSchema = new mongoose.Schema({
    team_name : { type : String , required : true } ,
    project_id : { type : mongoose.Schema.Types.ObjectId , ref: "Project" },
    organization_id : { type : mongoose.Schema.Types.ObjectId, ref: "Organization" } ,
    team_manager_id : { type : mongoose.Schema.Types.ObjectId, ref: "User" } ,
    description : { type : String },
    team_leader_id : { type : mongoose.Schema.Types.ObjectId, ref: "User" },
    users : [{ type : mongoose.Schema.Types.ObjectId , ref: "User"} ]
}); 

export default mongoose.model("ProjectTeam", projectTeamSchema);
