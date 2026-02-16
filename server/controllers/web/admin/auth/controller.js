import Admin from "#models/Admin.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Account from "#models/Account.js";
export const register = asyncHandler(
    async (req, res) => {
            console.log(req.body);
            const { name, email, password, number: phoneNumber } = req.body;
            if(!name || !email || !password || !phoneNumber) {
                return res.status(400).json({message: "Missing fields"})
            }

            const existingUser = await Admin.findOne({email : email});
    
            if(existingUser){
                return res.status(409).json({
                    message : "Admin already exists"
                })
            }
    
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const user = await Admin.create({
                name,
                email: email.trim(),
                phoneNumber,
            });

            const account = await Account.create({
                password: hashedPassword,
                email: user.email,
                role: "admin",
            });
            const token = jwt.sign(
                { userId : user._id },
                process.env.SECRET_KEY,
                { expiresIn : process.env.JWT_EXPIRES_IN }
            )

            const isLive = process.env.MODE === "production";

            res.cookie("accessToken", token, {
                httpOnly: false,
                secure: isLive,
                sameSite: isLive ? "none" : "lax",
                maxAge: 1000 * 60 * 60 * 24
            })

            return res.status(201).json({
                message: "Register Successful",
                userDetails: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                },
                token: token,
            });
}, "REGISTER_ADMIN_CONTROLLER_ERROR");

export const login = asyncHandler(
    async(req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const account = await Account.findOne({ email: email.trim() });
        if (!account || account.role !== "admin") {
            return res.status(401).json({ message: "Admin does not exist" });
        }
        const adminAccount = await Account.findOne({email : admin.email})
        const isMatch = await bcrypt.compare(
            password,
            account.password
        );

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const admin = await Admin.findOne({ email: email.trim() });

        const token = await jwt.sign({ userId: admin._id }, process.env.SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        })

        const isLive = process.env.MODE === "production";
        console.log(token)
        // res.cookie("accessToken", token, {
        //     httpOnly: false,
        //     secure: isLive,
        //     sameSite: "none",
        //     maxAge: 1000 * 60 * 60 * 24
        // })

        res.cookie("accessToken", token, {
            httpOnly: false,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
        })


        return res.status(200).json({
            message: "Login Successful",
            token: token
        });

}, "LOGIN_ADMIN_ERROR");