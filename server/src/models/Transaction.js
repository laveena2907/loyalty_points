const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true
        },

        type: {
            type: String,
            enum: ["EARN", "REDEEM"],
            required: true
        },

        points: {
            type: Number,
            required: true
        },

        amount: {
            type: Number,
            default: null
        },

        description: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);