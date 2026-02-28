import { insertEmployees } from "#adminHelper/employee/helper.js";
import bcrypt from "bcrypt";
import {pick} from "#helpers/data.reducer.js";

const insertByFrom = asyncHandler(
    async(req, res) => {

        
        const {userName : name, email, phone, userId: employeeId, organizationId, doj: dateOfJoining} = req.body; // mandatory fields
        const {gender, salary, dob, address, teamId, roleInTeam, isActive} = req.body; // optional fields



        const user_form_data = {name, email, phone, employeeId, organizationId, dateOfJoining};
        const optional_form_data = {gender, salary, dob, address, teamId, roleInTeam, isActive};

        const toemp = {
            "userName": "athi***gaku",
            "email" : "123@gmail.com",
            "phone": "7777777777",
            "userId": "1234",
            "organizationId": "64a1f0c9e8bfae5d6c3b2a1f",
            "dateOfJoining": "2023-06-01",
        }

        const password = process.env.USER_DEFAULT_PASSWORD;
        const mandatory_form_data = {
            ...user_form_data,
            password: await bcrypt.hash(password, 10),
        }

        console.log("Check1");

        if (Object.values(mandatory_form_data).some(value => !value)){
            return res.status(400).json({
                error: "Mandatory fields are missing"
            });
        }

        console.log("Check2");

        const filtered_optional_fields =  Object.fromEntries(
            Object.entries(optional_form_data).filter(([_,value]) => value)
        );

        console.log("Check3");

        const form_data = {...mandatory_form_data, ...filtered_optional_fields};

        await insertEmployees([form_data]);

        console.log("Check4");

        return res.status(201).json({
            message: "Employee added successfully",
            employeeData: form_data
        });

    } ,  "INSERT_BY_FORM_ERROR"
);

export default insertByFrom;