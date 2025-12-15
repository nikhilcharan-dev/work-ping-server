
import mongoose from "mongoose";


const organisationSchema = new mongoose.Schema({
  organisationName: { type: String , required : true },
  geoFencing: { type: String },
  CLDays: { type: String },
  type: { type: String },
  description: { type: String },
  ipAddress: { type: String },
  foundedAt: { type: Date }
});

export default mongoose.model("Organisation", organisationSchema);

