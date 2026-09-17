const mongoose = require("mongoose");

const outboxSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true
        },

        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true
        },

        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        processed: {
            type: Boolean,
            default: false
        }
    }
);

const Outbox = mongoose.model("Outbox", outboxSchema);

module.exports = Outbox;