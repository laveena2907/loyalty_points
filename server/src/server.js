const clockRoutes = require("./routes/clock.routes");
const outboxRoutes = require("./routes/outbox.routes");
const authRoutes = require("./routes/auth.routes");
const memberRoutes = require("./routes/member.routes");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);

app.use("/api/clock", clockRoutes);
app.use("/api/outbox", outboxRoutes);

app.use("/clock", clockRoutes);
app.use("/outbox", outboxRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Loyalty Points API is running"
    });
});

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });