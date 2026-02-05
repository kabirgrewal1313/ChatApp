import dotenv from "dotenv"
import http from "http"
import app from "./appmain.js"
import connectDb from "./db.js"
import initSocket from "./socket/index.js"
dotenv.config()
const server=http.createServer(app)
connectDb()
initSocket(server)
server.listen(process.env.PORT,()=>{
    console.log(`Process Running successfully on ${process.env.PORT}`)
})