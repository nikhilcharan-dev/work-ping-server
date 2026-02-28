import mongoose from "mongoose"

const projectTeamSchema = new mongoose.Schema({
    teamName : { type : String , required : true } ,
    projectId : { type : mongoose.Schema.Types.ObjectId , ref: "Project" },
    organizationId : { type : mongoose.Schema.Types.ObjectId, ref: "Organization" } ,
    teamManagerId : { type : mongoose.Schema.Types.ObjectId, ref: "User" } ,
    description : { type : String },
    teamLeaderId : { type : mongoose.Schema.Types.ObjectId, ref: "User" },
    users : [{ type : mongoose.Schema.Types.ObjectId , ref: "User"} ]
}, { timestamps: true });

export default mongoose.model("ProjectTeam", projectTeamSchema);
