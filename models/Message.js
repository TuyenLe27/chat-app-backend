const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    avatar: { type: String, default: "" }, // Lưu avatar (base64 hoặc URL)
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
