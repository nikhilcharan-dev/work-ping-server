import mongoose from "mongoose";
import { bioDataSchema, credentialsSchema } from "./utils/utils.js";

const AdministratorSchema = new mongoose.Schema({
    ...bioDataSchema,
    ...credentialsSchema,

    organisation: { type: String, required: true, unique: true },
    organisation_type: { type: String, required: true },
});

const Administrator = mongoose.model("Administrator", AdministratorSchema);
export default Administrator;