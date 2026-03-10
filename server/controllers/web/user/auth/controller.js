import User from "#models/User.js";
import Account from "#models/Account.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
    validateEmail,
    validatePassword,
    validateName,
    validateObjectId,
    validateRequiredFields
} from "#utils/validators.js";

export const register = asyncHandler(
    async (req, res) => {
        const { name, userEmail, password, organizationId, role } = req.body;
        
        // Validate required fields
        const requiredCheck = validateRequiredFields(
            { name, userEmail, password, organizationId, role },
            ['name', 'userEmail', 'password', 'organizationId', 'role']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({ message: requiredCheck.error });
        }
        
        // Validate name
        const nameValidation = validateName(name);
        if (!nameValidation.valid) {
            return res.status(400).json({ message: nameValidation.error });
        }
        
        // Validate email
        const emailValidation = validateEmail(userEmail);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.error });
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ message: passwordValidation.error });
        }
        
        // Validate organization ID
        const orgIdValidation = validateObjectId(organizationId, "Organization ID");
        if (!orgIdValidation.valid) {
            return res.status(400).json({ message: orgIdValidation.error });
        }
        
        const existingUser = await Account.findOne({ email: emailValidation.normalized });

        if (existingUser) {
            return res.status(409).json({
                message: "User Already Exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: nameValidation.normalized,
            email: emailValidation.normalized,
            organizationId: organizationId,
            role: role
        });

        await Account.create({
            role,
            email: emailValidation.normalized,
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

        // Validate required fields
        const requiredCheck = validateRequiredFields(
            { userEmail, password },
            ['userEmail', 'password']
        );
        if (!requiredCheck.valid) {
            return res.status(400).json({ message: requiredCheck.error });
        }
        
        // Validate email format
        const emailValidation = validateEmail(userEmail);
        if (!emailValidation.valid) {
            return res.status(400).json({ message: emailValidation.error });
        }

        const user = await Account.findOne({ email: emailValidation.normalized });
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
            maxAge: 1000 * 60 * 60 * 24
        })

        const userMetaDetails = await User.findOne({
            email: emailValidation.normalized
        })

        return res.status(200).json({
            message: "Login Successful",
            userDetails: userMetaDetails,
        });
    }, "USER_AUTH_LOGIN_ERROR");