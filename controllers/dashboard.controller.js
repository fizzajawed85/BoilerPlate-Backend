const Appointment = require('../models/Appointment');
const User = require('../models/User');

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.userId;

        // 1. Fetch User Data
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Fetch Nearest Upcoming Appointment
        const today = new Date().toISOString().split('T')[0];
        const appointments = await Appointment.find({
            userId,
            date: { $gte: today },
            status: { $in: ['Confirmed', 'Pending'] }
        });

        // Manually sort because json_db's sort is just a mock
        appointments.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });

        const upcomingAppointment = appointments.length > 0 ? (typeof appointments[0].toObject === 'function' ? appointments[0].toObject() : { ...appointments[0] }) : null;

        // Resolve doctor image if missing
        if (upcomingAppointment && !upcomingAppointment.doctorImageUrl) {
            try {
                const Doctor = require('../models/Doctor');
                const doctor = await Doctor.findOne({ name: upcomingAppointment.doctorName });
                if (doctor && doctor.imageUrl) {
                    upcomingAppointment.doctorImageUrl = doctor.imageUrl;
                }
            } catch (err) {
                console.log('LOG Error resolving doctor image for dashboard:', err.message);
            }
        }

        // 3. Health Statistics from user document
        const statistics = [
            { id: 'heart_rate', label: 'Heart Rate', value: user.healthStats?.heartRate || '72', unit: 'BPM', trend: '+2%', status: 'up' },
            { id: 'bp', label: 'Blood Pressure', value: user.healthStats?.bp || '120/80', unit: 'mmHg', trend: '-1%', status: 'down' },
            { id: 'steps', label: 'Daily Steps', value: user.healthStats?.steps || '4,230', unit: 'steps', trend: '+15%', status: 'up' },
            { id: 'sleep', label: 'Sleep Quality', value: user.healthStats?.sleep || '7.5', unit: 'hrs', trend: '+0.5h', status: 'up' },
        ];

        // 4. Medication Info
        const medication = {
            name: user.medication?.name || 'Aspirin',
            dosage: user.medication?.dosage || '100mg',
            instruction: user.medication?.instruction || 'After breakfast',
            time: user.medication?.time || '08:00 AM'
        };

        res.status(200).json({
            user: {
                username: user.username,
                email: user.email
            },
            upcomingAppointment,
            statistics,
            medication
        });
    } catch (error) {
        console.error('❌ DASHBOARD ERROR:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
