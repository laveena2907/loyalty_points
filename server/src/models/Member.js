const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },

        pointsBalance: {
            type: Number,
            default: 0,
            min: 0
        },

        lifetimePoints: {
            type: Number,
            default: 0,
            min: 0
        },

        tier: {
            type: String,
            enum: ["SILVER", "GOLD", "PLATINUM"],
            default: "SILVER"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Member", memberSchema);