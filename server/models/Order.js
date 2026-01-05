import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderId : {type: String, required: true, unique: true},

        userId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true
        },

        planId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan", 
            required: true
        },

        amount : {type: Number, required: true},

        date : {type: Date, required: true},

        paymentMethod: {
            type: String, 
            enum: ["Credit Card", "Debit Card", "UPI", "Net Banking"],
            required: true
        },

        orderStatus: {
            type: String, 
            enum: ["Success", "Failed", "Pending"],
            required: true
        }
        
    },
    {timestamps: true}
);

export default mongoose.model("Order", orderSchema);