import { Server } from "socket.io";
import { socketAuth } from "./auth.js";
import { onlineUsers } from "./presence.js";
import Message from "../models/Message.js"

const initSocket=(httpServer)=>{
    const io=new Server(httpServer,{
        cors:{origin:"*"}
    })
    io.use(socketAuth)
    io.on("connection",(socket)=>{
        const userId=socket.userId
        if(!onlineUsers.has(userId)){
            onlineUsers.set(userId,new Set())
        }
        onlineUsers.get(userId).add(socket.id)
        console.log(`User ${userId} is online`)

        socket.on("disconnect",()=>{
            const userSockets=onlineUsers.get(userId)
            if(!userSockets) return
            userSockets.delete(socket.id)
            if(userSockets.size===0){
                onlineUsers.delete(userId)
                console.log(`user ${userId} offline`)
            }
        })
        socket.on("sendMessage",({receiverId,text})=>{
            if(!text||!receiverId) return
            const senderId=socket.userId
            Message.create({
                sender:senderId,
                receiver:receiverId,
                text
            })
            const receiverSockets=onlineUsers.get(receiverId)
            if(receiverSockets){
                for(const socketId of receiverSockets){
                    io.to(socketId).emit("receiveMessage",{
                        senderId,
                        text,
                        createdAt:new Date()
                    })
                }
            }
        })
    })
    return io
}

export default initSocket
