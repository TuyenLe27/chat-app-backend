const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import model tin nhắn
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Kết nối MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error(err));

// Socket.io logic
io.on('connection', async (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Gửi lịch sử tin nhắn khi user mới vào
    const messages = await Message.find().sort({ createdAt: 1 });
    socket.emit('chatHistory', messages);

    // Nhận tin nhắn mới từ client
    socket.on('sendMessage', async (message) => {
        const newMessage = new Message({
            username: message.username,
            text: message.text
        });

        await newMessage.save();

        // Phát lại tin nhắn cho tất cả client
        io.emit('receiveMessage', newMessage);
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

// Test route
app.get('/', (req, res) => {
    res.send('Chat App Backend is running...');
});

// Start server
server.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
});
