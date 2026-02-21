require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const userRoutes = require('./routes/user.routes');
const recordsRoutes = require('./routes/records.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// DB Connection (Bypassed for local JsonModel)
// mongoose.connect(process.env.MONGO_URI)...
console.log('✅ Local JSON Database Mode Active (Bypassing Atlas for Hackathon)');

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Medical Appointment & Records Management API',
        status: 'Running',
        endpoints: {
            auth: '/api/auth',
            appointments: '/api/appointments',
            user: '/api/user',
            records: '/api/records',
            notifications: '/api/notifications',
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/test', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({ server: 'Running', database: dbStatus });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;

process.on('unhandledRejection', (err) => {
    console.log('❌ UNHANDLED REJECTION!', err.name, err.message);
    if (process.env.NODE_ENV !== 'production') process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.log('❌ UNCAUGHT EXCEPTION!', err.name, err.message);
    if (process.env.NODE_ENV !== 'production') process.exit(1);
});
