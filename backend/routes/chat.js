import express from "express";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { httpAuth } from "../middleware/auth.js";

const router = express.Router();

// Get all users except the current one
router.get("/users", httpAuth, async (req, res) => {
  try {
    const users = await User.find(
      { _id: { $ne: req.userId } },
      { username: 1, email: 1 }
    ).sort({ username: 1 });

    res.json({
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages between current user and another user
router.get("/messages/:userId", httpAuth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      messages: messages.map((m) => ({
        id: m._id,
        sender: m.sender.toString(),
        receiver: m.receiver.toString(),
        text: m.text,
        createdAt: m.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

