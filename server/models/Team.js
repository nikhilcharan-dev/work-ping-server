import mongoose from "mongoose"

const teamSchema = new mongoose.Schema({
    teamName : { type : String , required : true } ,
    organizationId : { type : mongoose.Schema.Types.ObjectId, ref: "Organization" } ,
    teamManagerId : { type : mongoose.Schema.Types.ObjectId, ref: "User" } ,
    description : { type : String },
    teamLeaderId : { type : mongoose.Schema.Types.ObjectId, ref: "User" },
}); 

export default mongoose.model("Team", teamSchema);
