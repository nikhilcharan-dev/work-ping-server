import mongoose from "mongoose";
import { bioDataSchema, credentialsSchema } from "./utils/utils.js";

const EmployeeSchema = new mongoose.Schema({
    ...bioDataSchema,
    ...credentialsSchema,

    salary: { type: Number, required: true },
    date_of_joining: { type: Date, default: Date.now },
    beneficiary: { type: [String], default: [] },
    status: { type: String, default: "active" },

    organization_id: { type: String },

    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "Manager", required: true },
})

const Employee = mongoose.model("Employee", EmployeeSchema);
export default Employee;