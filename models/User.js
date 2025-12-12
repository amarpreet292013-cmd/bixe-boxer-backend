import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password_hash: String,
    subscription_expiry: Number,
    status: String,
    payment_id: String
});

export default mongoose.model("User", UserSchema);

