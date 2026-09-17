const Outbox = require("../models/Outbox");

const getOutbox = async (req, res) => {
    try {
        const events = await Outbox
            .find()
            .sort({ createdAt: -1 });

        res.json({
            events
        });

    } catch (error) {
        console.error("Outbox error:", error);

        res.status(500).json({
            message: "Failed to fetch outbox",
            error: error.message
        });
    }
};

module.exports = {
    getOutbox
};