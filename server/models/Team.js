import mongoose from "mongoose"

const teamSchema = new mongoose.Schema({
    teamName : { type : String , required : true } ,
    teamManagerId : { type : Number } ,
    description : { type : String },
    teamLeaderId : { type : Number }
}); 

export default mongoose.model("Team", teamSchema);