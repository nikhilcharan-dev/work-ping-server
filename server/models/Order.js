import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
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
            default: "UPI"
        },

        orderStatus: {
            type: String, 
            enum: ["Success", "Failed", "Pending"],
            default: "Pending"
        },

        phonepeOrderId:{
            type: String,
            default: ""
        }
        
    },
    {timestamps: true}
);

export default mongoose.model("Order", orderSchema);