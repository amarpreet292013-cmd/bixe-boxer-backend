import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import bodyParser from "body-parser";
import cors from "cors";
import User from "./models/User.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ==================== MONGODB ====================
mongoose.connect("mongodb+srv://amarpreet292013_db_user:LNuyYatScxLKNcJU@cluster0.qjttupi.mongodb.net/bixe-boxer?retryWrites=true&w=majority")
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

// ==================== RAZORPAY ====================
const razor = new Razorpay({
    key_id: "YOUR_RAZORPAY_KEY",
    key_secret: "YOUR_RAZORPAY_SECRET"
});

// ==================== REGISTER ====================
app.post("/register", async (req,res)=>{
    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if(exists) return res.json({ error: "Email already used" });

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
        email,
        password_hash: hash,
        subscription_expiry: 0,
        status: "expired"
    });

    await user.save();
    res.json({ message: "Registered" });
});

// ==================== LOGIN ====================
app.post("/login", async (req,res)=>{
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if(!user) return res.json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password_hash);
    if(!match) return res.json({ error: "Wrong password" });

    const token = jwt.sign({ user_id: user._id }, "SECRET123");

    res.json({ token, user_id: user._id });
});

// ==================== CREATE ORDER ====================
app.post("/create-order", async (req,res)=>{
    const order = await razor.orders.create({
        amount: 20*100, // ₹20
        currency: "INR",
        receipt: "6-month-plan"
    });
    res.json(order);
});

// ==================== VERIFY PAYMENT ====================
app.post("/verify-payment", async (req,res)=>{
    const { user_id, payment_id } = req.body;

    const expiry = Date.now() + (6*30*24*60*60*1000); // 6 months

    await User.findByIdAndUpdate(user_id, {
        payment_id,
        subscription_expiry: expiry,
        status: "active"
    });

    res.json({ message: "Subscription activated" });
});

// ==================== CHECK LICENSE ====================
app.get("/check-license", async (req,res)=>{
    const { user_id } = req.query;
    const user = await User.findById(user_id);
    if(!user) return res.json({ valid:false });

    if(Date.now() > user.subscription_expiry){
        user.status = "expired";
        await user.save();
        return res.json({ valid:false });
    }

    res.json({ valid:true });
});

app.listen(3000, ()=>console.log("Backend running on port 3000"));

