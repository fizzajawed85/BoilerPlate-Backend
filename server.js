require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// DB Connection - Simplified for Vercel serverless
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('❌ DB Connection Error:', err.message));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Boilerplate API Server',
        status: 'Running',
        endpoints: {
            auth: '/api/auth',
            test: '/test'
        }
    });
});

app.use('/api/auth', authRoutes);

app.get('/test', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({ server: 'Running', database: dbStatus });
});

const PORT = process.env.PORT || 5000;

// Only listen if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel serverless
module.exports = app;

// Global Error Handlers
process.on('unhandledRejection', (err) => {
    console.log('❌ UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    console.log('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.log(err.name, err.message);
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});
