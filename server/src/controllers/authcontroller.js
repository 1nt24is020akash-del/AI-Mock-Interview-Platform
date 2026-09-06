const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

const JWT_SECRET = process.env.JWT_SECRET || "ai_mock_interview_super_secret_jwt_key_2026";

const signToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const normalizedEmail = (email || "").trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists)
      return res.status(409).json({ message: "Email already in use. Please sign in instead." });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });
    const token = signToken(user._id.toString());

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Register error:", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors || {}).map((e) => e.message);
      return res.status(400).json({ message: messages[0] || "Validation failed" });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already in use. Please sign in instead." });
    }
    res.status(500).json({ message: err.message || "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const normalizedEmail = (email || "").trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user._id.toString());

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message || "Login failed" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, getMe };
