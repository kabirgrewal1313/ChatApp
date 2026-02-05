import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || [
      "http://localhost:5173",
      "http://localhost:5174"
    ],
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

export default app;