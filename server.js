require('dotenv').config();
const dns = require('dns');

// Force Google DNS to bypass local network SRV resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// DB Connection
mongoose.connect(process.env.MONGO_URI, {
    family: 4 // Force IPv4 to avoid DNS SRV issues in some networks
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('❌ DB Connection Error:', err.message));

// Routes
app.use('/api/auth', authRoutes);

app.get('/test', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({ server: 'Running', database: dbStatus });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Global Error Handlers
process.on('unhandledRejection', (err) => {
    console.log('❌ UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.log('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});
