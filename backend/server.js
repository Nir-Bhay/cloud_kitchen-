const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json()); // Parse JSON body

// CORS Configuration
const corsOptions = {
    origin: ["https://nir-bhay.github.io"], // GitHub Pages root URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true
};
app.use(cors(corsOptions));


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// User Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" } // Default role is "user"
});
const User = mongoose.model("User", userSchema);

// Admin Credentials (hardcoded for simplicity)
const adminCredentials = {
    email: "admin@gmail.com",  // Set the admin email
    password: "321"    // Set the admin password
};

// Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("Signup request received:", req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Error in signup:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Login Route
app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request received:", req.body);

        // Check if the login is for admin
        if (email === adminCredentials.email && password === adminCredentials.password) {
            const token = jwt.sign(
                { userId: "admin", role: "admin" },
                process.env.JWT_SECRET || "mysecretkey",
                { expiresIn: "1h" }
            );
            return res.status(200).json({ token, role: "admin", message: "Admin login successful" });
        }

        // Check if user exists for regular users
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check if password matches
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || "mysecretkey",
            { expiresIn: "1h" }
        );

        res.status(200).json({ token, role: user.role, message: "Login successful" });
    } catch (error) {
        console.error("❌ Error in login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Start Server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
