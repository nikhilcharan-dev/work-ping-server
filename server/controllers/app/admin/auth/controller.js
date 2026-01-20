import Admin from "#models/Admin.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = asyncHandler(
    async (req, res) => {
    const { name, userEmail, password } = req.body;
            const existingUser = await Admin.findOne({email : userEmail});
    
            if(existingUser){
                return res.status(409).json({
                    message : "Admin Already Exists"
                })
            }
    
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const user = await Admin.create({
                name,
                email: userEmail.trim(),
                password: hashedPassword,
            });
    
            const token = jwt.sign({ userId : user._id, },
                process.env.SECRET_KEY,
                { expiresIn : "1h" }
            )
    
            return res.status(201).json({
                message: "Register Successful",
                userDetails: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
                token: token,
            });
}, "REGISTER_ADMIN_CONTROLLER_ERROR");

export const login = asyncHandler(
    async(req,res) => {
    const { userEmail, password } = req.body;

        if (!userEmail || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const admin = await Admin.findOne({ email: userEmail.trim() });
        if (!admin) {
            return res.status(401).json({ message: "Admin does not exist" });
        }

        const isMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = await jwt.sign({ userId: admin._id }, process.env.SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        })

        const isLive = process.env.MODE === "production";

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
        })

        return res.status(200).json({
            message: "Login Successful",
        });
}, "LOGIN_ADMIN_ERROR");