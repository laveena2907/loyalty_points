const mongoose = require("mongoose");

const pointLotSchema = new mongoose.Schema(
    {
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true,
            index: true
        },

        points: {
            type: Number,
            required: true,
            min: 0
        },

        remainingPoints: {
            type: Number,
            required: true,
            min: 0
        },

        earnedAt: {
            type: Date,
            default: Date.now
        },

        expiresAt: {
            type: Date,
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

const PointLot = mongoose.model("PointLot", pointLotSchema);

module.exports = PointLot;