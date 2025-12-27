import { Router } from 'express';
import Admin from "../../../models/Admin.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/register', async (req, res) => {
    try {
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

    } catch(err) {
        console.log(err);
        return res.status(500).json({ message: "Interval Server Error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { userEmail, password } = req.body;

        if (!userEmail || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await Admin.findOne({ email: userEmail.trim() });
        if (!user) {
            return res.status(401).json({ message: "Admin does not exist" });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        })
        return res.status(200).json({
            message: "Login Successful",
            token: token,
            userDetails: {
                id: user._id,
                name: user.name,
                teamId: user.teamId || "NA",
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
