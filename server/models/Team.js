import mongoose from "mongoose"

const teamSchema = new mongoose.Schema({
    teamName : { type : String , required : true } ,
    organizationId : { type : Schema.Types.ObjectId, ref: "Organization" } ,
    teamManagerId : { type : Schema.Types.ObjectId, ref: "User" } ,
    description : { type : String },
    teamLeaderId : { type : Schema.Types.ObjectId, ref: "User" },
    
}); 

export default mongoose.model("Team", teamSchema);
