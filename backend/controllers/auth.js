import User from "../models/User.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const createAccessToken=(userId)=>{
    return jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:"15m"})
}

const createRefreshToken=(userId)=>{
    return jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:"30d"})
}

export const signup=async (req,res)=>{
    try{
        const {username,email,password}=req.body
        if(!username||!email||!password){
            res.status(400).json({message:"Fields Missing"})
        }
        const existingUser=await User.findOne({email})
        if(existingUser){
            res.status(409).json({message:"User Exists"})
        }
        const hashedPassword=await bcrypt.hash(password,10)
        const user=await User.create({
            username,
            email,
            password: hashedPassword
        })
        const accessToken=createAccessToken(user._id)
        const refreshToken=createRefreshToken(user._id)
        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:false,
            sameSite:"lax",
            path: "/",
            maxAge:30*24*60*60*1000
        })
        res.status(201).json({
            message:"Signup Successful",
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
            },
            accessToken
        })
    }
    catch(err){
        console.error(err)
        res.status(500).json({message:"server error"})
    }
}

export const login=async (req,res)=>{
    try{
        const {email,password}=req.body
        if(!email||!password){
            res.status(409).json({message:"Missing Fields"})
        }
        const user=await User.findOne({email})
        if(!user){
            res.status(401).json({message:"invalid credentials"})
        }
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch){
            res.status(401).json({message:"invalid credentials"})
        }
        const accessToken=createAccessToken(user._id)
        const refreshToken=createRefreshToken(user._id)
        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            secure:false,
            sameSite:"lax",
            path: "/",
            maxAge:30*24*60*60*1000
        })
        res.status(201).json({
            message:"Login Successful",
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
            },
            accessToken
        })
    }
    catch(err){
        console.error(err)
        res.status(500).json({message:"server error"})
    }
}
export const refresh=async (req,res)=>{
    try{
        const refreshToken=req.cookies?.refreshToken
        console.log(refreshToken)
        if(!refreshToken){
            return res.status(401).json({ message: "No refresh token" });
        }
        const payload=jwt.verify(refreshToken,process.env.JWT_SECRET)
        const userId=payload.userId
        const newAccessToken=createAccessToken(userId)
        res.json({
            accessToken:newAccessToken
        })
    }
    catch(err){
        console.error(err)
        res.status(500).json({message:"invalid refresh token"})
    }
}