import mongoose from 'mongoose'

const PhoneSchema = new mongoose.Schema({
    phone: { type: String, unique: true, required: true },
    otp: { type: String, unique: true, required: true },
})

export default mongoose.model('Phone', PhoneSchema);