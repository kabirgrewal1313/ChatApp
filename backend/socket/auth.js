import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()
export const socketAuth=(socket,next)=>{
    try{
        const token=socket.handshake.auth?.token
        if(!token){
            return next(new Error("No Token"))
        }
        const payload=jwt.verify(token,process.env.JWT_SECRET)
        socket.userId=payload.userId
        next()
    }
    catch(err){
        next(new Error("Invalid Token"))
    }
}