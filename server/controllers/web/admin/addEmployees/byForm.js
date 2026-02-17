import { insertEmployees } from "#adminHelper/employee/helper.js";
import bcrypt from "bcrypt";

const insertByFrom = asyncHandler(
    async(req, res) => {
        const {userName : name, email, phone, userId: employeeId, gender, organizationId, role} = req.body; // mandatory fields
        const {dob, address, doj: dateOfJoining, teamId, roleInTeam, isActive, aadhaar: aadhaarId, pan: panId} = req.body; // optional fields
        const user_form_data = {name, email, phone, employeeId, gender, organizationId, role};
        const optional_form_data = {dob, address, dateOfJoining, teamId, roleInTeam, isActive, aadharId, panId};

        const password = process.env.USER_DEFAULT_PASSWORD;
        const mandatory_form_data = {
            ...user_form_data,
            password: await bcrypt.hash(password, 10),
        }

        if (Object.values(mandatory_form_data).some(value => !value)){
            return res.status(400).json({
                error: "Mandatory fields are missing"
            });
        }

        const filtered_optional_fields = Object.fromEntries(
            Object.entries(optional_form_data).filter(([_,value]) => value)
        );

        const form_data = {...mandatory_form_data, ...filtered_optional_fields};

        insertEmployees([form_data]);


    } , "INSERT_BY_FORM_ERROR"
);
export default insertByFrom