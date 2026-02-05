import dotenv from "dotenv";
import bcrypt from "bcrypt";
import connectDb from "./db.js";
import User from "./models/User.js";

dotenv.config();

const usersToCreate = [
  {
    username: "Alice",
    email: "alice@example.com",
    password: "password123"
  },
  {
    username: "Bob",
    email: "bob@example.com",
    password: "password123"
  },
  {
    username: "Charlie",
    email: "charlie@example.com",
    password: "password123"
  }
];

async function seed() {
  try {
    await connectDb();

    for (const u of usersToCreate) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`User already exists: ${u.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(u.password, 10);
      const created = await User.create({
        username: u.username,
        email: u.email,
        password: hashedPassword
      });

      console.log(
        `Created user: ${created.username} (${created.email}) with password "${u.password}"`
      );
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding users:", err);
    process.exit(1);
  }
}

seed();

