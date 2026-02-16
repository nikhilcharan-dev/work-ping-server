import User from "#models/User.js";
import Account from "#models/Account.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = asyncHandler(
    async (res, req) => {
        const { name, userEmail, password, organizationId, role } = req.body;
        const existingUser = await Account.findOne({ email: userEmail.trim() });

        if (existingUser) {
            return res.status(409).json({
                message: "User Already Exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: userEmail.trim(),
            organizationId: organizationId,
            role: role
        });

        await Account.create({
            role,
            email: userEmail.trim(),
            password: hashedPassword,
        })

        const token = jwt.sign({ userId: user._id, },
            process.env.SECRET_KEY,
            { expiresIn: "1h" }
        )

        return res.status(201).json({
            message: "Register Successful",
            userDetails: {
                id: user._id,
                name: user.name,
                email: user.email,
                organizationId: user.organizationId,
                role: user.role,
            },
            token: token,
        });
    }, "USER_AUTH_REGISTER_ERROR");

export const login = asyncHandler(
    async (req, res) => {
        const { userEmail, password } = req.body;

        if (!userEmail || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await Account.findOne({ email: userEmail.trim() });
        if (!user) {
            return res.status(401).json({ message: "User does not exist" });
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

        const isLive = process.env.MODE === "production";

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: isLive,
            sameSite: isLive ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24 // 1 Day
        })

        const userMetaDetails = await User.findOne({
            email: userEmail.trim()
        })

        return res.status(200).json({
            message: "Login Successful",
            userDetails: userMetaDetails,
        });
    }, "USER_AUTH_LOGIN_ERROR");