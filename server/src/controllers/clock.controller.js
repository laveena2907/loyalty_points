const PointLot = require("../models/PointLot");
const Member = require("../models/Member");
const Transaction = require("../models/Transaction");
const { calculateTier } = require("../utils/points");

const runClock = async (req, res) => {
    try {
        const now = req.body.now
            ? new Date(req.body.now)
            : new Date();

        if (Number.isNaN(now.getTime())) {
            return res.status(400).json({
                message: "Invalid clock time"
            });
        }

        const expiredLots = await PointLot.find({
            expiresAt: { $lte: now },
            remainingPoints: { $gt: 0 }
        });

        let expiredPoints = 0;
        let affectedMembers = 0;

        for (const lot of expiredLots) {
            const pointsToExpire = lot.remainingPoints;

            const member = await Member.findById(lot.memberId);

            if (!member) {
                lot.remainingPoints = 0;
                await lot.save();
                continue;
            }

            // Remove expired points from usable balance.
            member.pointsBalance = Math.max(
                0,
                member.pointsBalance - pointsToExpire
            );

            // Lifetime points NEVER decrease.
            member.lifetimePoints =
                member.lifetimePoints || 0;

            member.tier = calculateTier(
                member.lifetimePoints
            );

            await member.save();

            await Transaction.create({
                memberId: member._id,
                type: "EXPIRE",
                points: -pointsToExpire,
                description:
                    `Expired ${pointsToExpire} points`
            });

            lot.remainingPoints = 0;
            await lot.save();

            expiredPoints += pointsToExpire;
            affectedMembers++;
        }

        res.json({
            message: "Clock processed successfully",
            now,
            expiredPoints,
            affectedMembers
        });

    } catch (error) {
        console.error("Clock error:", error);

        res.status(500).json({
            message: "Clock processing failed",
            error: error.message
        });
    }
};

module.exports = {
    runClock
};