const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Domain frontend trên Netlify
const allowedOrigin = "https://chatapptlv27.netlify.app";

// Cấu hình Socket.IO với CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
  },
});

// Cấu hình CORS cho Express API
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST"],
}));
app.use(express.json());

// Kết nối MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { dbName: "chatapp" })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Theo dõi người dùng online
const users = [];

// Socket.io logic
io.on('connection', async (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Gửi lịch sử chat
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    socket.emit('chatHistory', messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
  }

  // Xử lý người dùng tham gia
  socket.on('userJoined', (username) => {
    users.push({ id: socket.id, username });
    io.emit('userList', users); // Gửi danh sách người dùng
    io.emit('userJoined', `${username} đã tham gia chat`);
  });

  // Xử lý gửi tin nhắn
  socket.on('sendMessage', async (message) => {
    try {
      const newMessage = new Message({
        username: message.username,
        text: message.text,
        createdAt: new Date(),
      });
      await newMessage.save();
      io.emit('receiveMessage', newMessage);
    } catch (err) {
      console.error('❌ Error saving message:', err);
    }
  });

  // Xử lý ngắt kết nối
  socket.on('disconnect', () => {
    const index = users.findIndex((user) => user.id === socket.id);
    if (index !== -1) {
      const username = users[index].username;
      users.splice(index, 1);
      io.emit('userList', users);
      io.emit('userJoined', `${username} đã rời chat`);
    }
    console.log('❌ User disconnected:', socket.id);
  });
});

// Test route
app.get('/', (req, res) => {
  res.send('Chat App Backend is running...');
});

// Start server
server.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});