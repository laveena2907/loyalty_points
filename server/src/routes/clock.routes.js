const express = require("express");

const {
    runClock
} = require("../controllers/clock.controller");

const router = express.Router();

router.post("/", runClock);

module.exports = router;