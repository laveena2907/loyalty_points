const Member = require("../models/Member");
const Transaction = require("../models/Transaction");
const PointLot = require("../models/PointLot");
const Outbox = require("../models/Outbox");

const {
    calculateTier,
    calculatePoints
} = require("../utils/points");


// ======================================================
// CREATE MEMBER
// ======================================================

const createMember = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                message: "Name and phone are required"
            });
        }

        const existingMember = await Member.findOne({ phone });

        if (existingMember) {
            return res.status(409).json({
                message: "Member with this phone number already exists"
            });
        }

        const member = await Member.create({
            name,
            phone,
            pointsBalance: 0,
            lifetimePoints: 0,
            tier: "SILVER"
        });

        res.status(201).json({
            message: "Member created successfully",
            member
        });

    } catch (error) {
        console.error("Create member error:", error);

        res.status(500).json({
            message: "Failed to create member",
            error: error.message
        });
    }
};


// ======================================================
// GET MEMBERS
// SEARCH + PAGINATION + SORTING
// ======================================================

const getMembers = async (req, res) => {
    try {
        const {
            search = "",
            page = 1,
            limit = 10,
            sort = "createdAt",
            order = "desc"
        } = req.query;

        const pageNumber = Math.max(Number(page), 1);

        const limitNumber = Math.min(
            Math.max(Number(limit), 1),
            50
        );

        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};

        // Search by name OR phone
        if (search) {
            filter = {
                $or: [
                    {
                        name: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        phone: {
                            $regex: search,
                            $options: "i"
                        }
                    }
                ]
            };
        }

        const sortOrder = order === "asc" ? 1 : -1;

        const [members, total] = await Promise.all([
            Member.find(filter)
                .sort({
                    [sort]: sortOrder
                })
                .skip(skip)
                .limit(limitNumber),

            Member.countDocuments(filter)
        ]);

        res.json({
            members,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber)
            }
        });

    } catch (error) {
        console.error("Get members error:", error);

        res.status(500).json({
            message: "Failed to fetch members",
            error: error.message
        });
    }
};


// ======================================================
// GET SINGLE MEMBER
// ======================================================

const getMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json({
            member
        });

    } catch (error) {
        console.error("Get member error:", error);

        res.status(500).json({
            message: "Failed to fetch member",
            error: error.message
        });
    }
};


// ======================================================
// UPDATE MEMBER
// ======================================================

const updateMember = async (req, res) => {
    try {
        const { name, phone } = req.body;

        const member = await Member.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        // Check duplicate phone
        if (phone && phone !== member.phone) {

            const existingMember = await Member.findOne({
                phone
            });

            if (existingMember) {
                return res.status(409).json({
                    message: "Phone number already belongs to another member"
                });
            }

            member.phone = phone;
        }

        if (name) {
            member.name = name;
        }

        await member.save();

        res.json({
            message: "Member updated successfully",
            member
        });

    } catch (error) {
        console.error("Update member error:", error);

        res.status(500).json({
            message: "Failed to update member",
            error: error.message
        });
    }
};


// ======================================================
// DELETE MEMBER
// ======================================================

const deleteMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);

        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        await Member.findByIdAndDelete(req.params.id);

        // Delete related point lots
        await PointLot.deleteMany({
            memberId: member._id
        });

        // Delete related transactions
        await Transaction.deleteMany({
            memberId: member._id
        });

        // Delete related outbox events
        await Outbox.deleteMany({
            memberId: member._id
        });

        res.json({
            message: "Member deleted successfully"
        });

    } catch (error) {
        console.error("Delete member error:", error);

        res.status(500).json({
            message: "Failed to delete member",
            error: error.message
        });
    }
};


// ======================================================
// RECORD PURCHASE
// ======================================================

const recordPurchase = async (req, res) => {
    const session = await Member.startSession();

    try {
        const amount = Number(req.body.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Purchase amount must be greater than 0"
            });
        }

        session.startTransaction();

        const member = await Member
            .findById(req.params.id)
            .session(session);

        if (!member) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Member not found"
            });
        }

        // --------------------------------------------------
        // Existing members backward compatibility
        // --------------------------------------------------

        if (typeof member.lifetimePoints !== "number") {
            member.lifetimePoints = 0;
        }

        if (!member.tier) {
            member.tier = "SILVER";
        }

        const oldTier = member.tier;

        // --------------------------------------------------
        // Calculate points using CURRENT tier
        // --------------------------------------------------

        const pointsEarned = calculatePoints(
            amount,
            oldTier
        );

        // --------------------------------------------------
        // Update balance
        // --------------------------------------------------

        member.pointsBalance += pointsEarned;

        // Lifetime points NEVER decrease
        member.lifetimePoints += pointsEarned;

        // --------------------------------------------------
        // Calculate new tier
        // --------------------------------------------------

        const newTier = calculateTier(
            member.lifetimePoints
        );

        member.tier = newTier;

        await member.save({
            session
        });

        // --------------------------------------------------
        // Create point lot
        // Points expire after 90 days
        // --------------------------------------------------

        const now = new Date();

        const expiresAt = new Date(
            now.getTime() +
            90 * 24 * 60 * 60 * 1000
        );

        await PointLot.create(
            [
                {
                    memberId: member._id,

                    points: pointsEarned,

                    remainingPoints: pointsEarned,

                    earnedAt: now,

                    expiresAt
                }
            ],
            {
                session
            }
        );

        // --------------------------------------------------
        // Record purchase transaction
        // --------------------------------------------------

        await Transaction.create(
            [
                {
                    memberId: member._id,

                    type: "EARN",

                    points: pointsEarned,

                    amount: amount,

                    description:
                        `Purchase of ₹${amount}`
                }
            ],
            {
                session
            }
        );

        // --------------------------------------------------
        // Tier notification
        // --------------------------------------------------

        if (oldTier !== newTier) {

            await Outbox.create(
                [
                    {
                        type: "TIER_CHANGED",

                        memberId: member._id,

                        payload: {
                            memberId: member._id,

                            memberName: member.name,

                            phone: member.phone,

                            oldTier: oldTier,

                            newTier: newTier
                        },

                        processed: false
                    }
                ],
                {
                    session
                }
            );
        }

        await session.commitTransaction();

        res.status(201).json({
            message: "Purchase recorded successfully",

            pointsEarned: pointsEarned,

            pointsBalance: member.pointsBalance,

            lifetimePoints: member.lifetimePoints,

            tier: member.tier,

            expiresAt: expiresAt
        });

    } catch (error) {

        await session.abortTransaction();

        console.error("Purchase error:", error);

        res.status(500).json({
            message: "Failed to record purchase",
            error: error.message
        });

    } finally {
        session.endSession();
    }
};


// ======================================================
// REDEEM POINTS
// ======================================================

const redeemPoints = async (req, res) => {
    const session = await Member.startSession();

    try {
        const points = Number(req.body.points);

        if (
            !Number.isInteger(points) ||
            points <= 0
        ) {
            return res.status(400).json({
                message: "Points must be a positive whole number"
            });
        }

        session.startTransaction();

        const member = await Member
            .findById(req.params.id)
            .session(session);

        if (!member) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Member not found"
            });
        }

        // --------------------------------------------------
        // Check available balance
        // --------------------------------------------------

        if (points > member.pointsBalance) {

            await session.abortTransaction();

            return res.status(400).json({
                message: "Insufficient points",

                availablePoints:
                    member.pointsBalance,

                requestedPoints:
                    points
            });
        }

        // --------------------------------------------------
        // Find usable point lots
        // Oldest expiring points are used first
        // --------------------------------------------------

        const now = new Date();

        const lots = await PointLot
            .find({
                memberId: member._id,

                remainingPoints: {
                    $gt: 0
                },

                expiresAt: {
                    $gt: now
                }
            })
            .sort({
                expiresAt: 1
            })
            .session(session);

        let remainingToRedeem = points;

        for (const lot of lots) {

            if (remainingToRedeem <= 0) {
                break;
            }

            const usedPoints = Math.min(
                lot.remainingPoints,
                remainingToRedeem
            );

            lot.remainingPoints -= usedPoints;

            remainingToRedeem -= usedPoints;

            await lot.save({
                session
            });
        }

        // --------------------------------------------------
        // Safety check
        // --------------------------------------------------

        if (remainingToRedeem > 0) {

            await session.abortTransaction();

            return res.status(400).json({
                message:
                    "Not enough unexpired points available"
            });
        }

        // --------------------------------------------------
        // Deduct balance
        // --------------------------------------------------

        member.pointsBalance -= points;

        // Lifetime points DO NOT decrease
        if (typeof member.lifetimePoints !== "number") {
            member.lifetimePoints = 0;
        }

        // Tier based on lifetime earned points
        member.tier = calculateTier(
            member.lifetimePoints
        );

        await member.save({
            session
        });

        // --------------------------------------------------
        // Record redemption
        // --------------------------------------------------

        await Transaction.create(
            [
                {
                    memberId: member._id,

                    type: "REDEEM",

                    points: -points,

                    description:
                        `Redeemed ${points} points`
                }
            ],
            {
                session
            }
        );

        await session.commitTransaction();

        res.json({
            message: "Points redeemed successfully",

            pointsRedeemed: points,

            pointsBalance:
                member.pointsBalance,

            lifetimePoints:
                member.lifetimePoints,

            tier:
                member.tier
        });

    } catch (error) {

        await session.abortTransaction();

        console.error("Redeem error:", error);

        res.status(500).json({
            message: "Failed to redeem points",
            error: error.message
        });

    } finally {
        session.endSession();
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    createMember,
    getMembers,
    getMember,
    updateMember,
    deleteMember,
    recordPurchase,
    redeemPoints
};