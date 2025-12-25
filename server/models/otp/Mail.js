import mongoose from 'mongoose'

const MailSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    otp: { type: String, unique: true, required: true },
})

export default mongoose.model('Mail', MailSchema);