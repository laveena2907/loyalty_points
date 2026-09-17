const express = require("express");

const {
    createMember,
    getMembers,
    getMember,
    updateMember,
    deleteMember,
    recordPurchase,
    redeemPoints
} = require("../controllers/member.controller");

const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createMember);
router.get("/", getMembers);
router.get("/:id", getMember);
router.put("/:id", updateMember);
router.delete("/:id", deleteMember);

router.post("/:id/purchase", recordPurchase);
router.post("/:id/redeem", redeemPoints);

module.exports = router;