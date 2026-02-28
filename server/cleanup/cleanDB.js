import User from "#models/User.js";
import Organization from "#models/Organization.js";


const init = async () => {
    
    const orgcreateres = await Organization.create({
        name: "testOrg",

    })

    await User.create({
        name: "tester",
        email: "tester@gmail.com",
        password: "12345",
        phone: "1234",
        employeeId: "12345",
        dateOfJoining: Date.now(),
        roleInTeam: "member",
        organizationId: orgcreateres._id
    })
}

export default init;