const express = require("express");

const {
    getOutbox
} = require("../controllers/outbox.controller");

const router = express.Router();

router.get("/", getOutbox);

module.exports = router;