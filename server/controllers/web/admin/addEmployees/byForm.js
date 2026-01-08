import { insertEmployees } from "#adminHelper/employee/helper";

export const insertByFrom = asyncHandler(
    async(req, res) => {
        const mandatory_form_data = {name, email, password, phone, employeeId, gender, organizationId, role} = req.body; // mandatory fields
        const optional_form_data = {profileImage , dob, address, dateOfJoining, teamId, roleInTeam, isActive} = req.body; // optional fields

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