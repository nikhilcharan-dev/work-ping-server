
import mongoose from "mongoose";


const organisationSchema = new mongoose.Schema({
  organisation_name: { type: String , required : true },
  geo_fencing: { type: String },
  cl_days: { type: String },
  type: { type: String },
  description: { type: String },
  ip_address: { type: String },
  founded_at: { type: Date }
});

export default mongoose.model("Organisation", organisationSchema);

