import dotenv from "dotenv";
import connectDb from "./db.js";
import User from "./models/User.js";

dotenv.config();

async function cleanup() {
  try {
    await connectDb();

    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users (all users removed).`);

    process.exit(0);
  } catch (err) {
    console.error("Error deleting users:", err);
    process.exit(1);
  }
}

cleanup();


