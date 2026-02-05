import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()
const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI,{
            dbName: "chat_app_db"
        })
        console.log("MongoDB connected")
    }
    catch(err){
        console.error(err)
        process.exit(1)
    }
}

export default connectDb