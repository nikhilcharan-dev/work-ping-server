import mongoose from 'mongoose';
import { bioDataSchema, credentialsSchema } from "./utils/utils.js";

const ManagerSchema = new mongoose.Schema({
    ...bioDataSchema,
    ...credentialsSchema,
    department: { type: String, required: true },

    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
})

const Manager = mongoose.model("Manager", ManagerSchema);
export default Manager;