import { Router } from 'express';
import User from '../models/User'
import bcrypt from 'bcrypt'
const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { name ,userEmail , password } = req.body;
        const existingUser = await User.findOne({email : userEmail});
        if(existingUser){
            return res.status(409).json({
                message : "User Already Exists"
            })
        }
        const newUser = {
            name : name ,
            email : userEmail,
            password : await bcrypt.hash(password,10),
        }
        await User.create(newUser)
        
        return res.status(201).json({
            message : "Register Successful",
            user_details: newUser.select('-password')
        })

    } catch(err) {
        console.log(err);
        return res.status(500).json({ message: "Interval Server Error" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { userEmail , password } = req.body;
        const existingUser = await User.findOne({email : userEmail});
        if(!existingUser){
            return res.status(401).json({
                message : "User Doesn't Exists"
            })
        }
        if( bcrypt.compare(password , existingUser.password ) ) {
            return res.status(401).json({
                message : "Incorrect Password"
            })
        }
        return res.status(200).json({
            message : "Login Successful",
            user_details: existingUser.select('-password')
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({ message: "Interval Server Error" });
    }
});

export default router;