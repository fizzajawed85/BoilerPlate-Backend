const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { createNotification } = require('./notification.controller');

const DEFAULT_DOCTOR_IMAGE =
    'https://images.unsplash.com/photo-1559839734-2b71f1e3c77d?q=80&w=150&auto=format&fit=crop';

const DOCTORS_SEED = [
    { _id: '5zuws8dnpmlw0acvg', name: 'Dr. Ahmed Raza', specialty: 'Cardiologist', imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Monday', time: '09:00' }, { day: 'Monday', time: '10:00' }, { day: 'Wednesday', time: '14:00' }] },
    { _id: 'yde5p7djvmlw0acvg', name: 'Dr. Sara Khan', specialty: 'Dermatologist', imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Tuesday', time: '11:00' }, { day: 'Thursday', time: '09:00' }] },
    { _id: 'j5ig5bof6mlw0acvg', name: 'Dr. Usman Ali', specialty: 'Neurologist', imageUrl: 'https://images.unsplash.com/photo-1582750433449-64c6dc6ff9a9?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Monday', time: '13:00' }, { day: 'Friday', time: '10:00' }] },
    { _id: '4posifn38mlw0acvg', name: 'Dr. Nadia Siddiqui', specialty: 'Gynecologist', imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71f1e3c77d?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Wednesday', time: '09:00' }, { day: 'Friday', time: '14:00' }] },
    { _id: '02iuf5yzmmlw0acvg', name: 'Dr. Bilal Hassan', specialty: 'Orthopedic', imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Tuesday', time: '10:00' }, { day: 'Saturday', time: '09:00' }] },
    { _id: 'qo4rkp41nmlw0acvg', name: 'Dr. Hina Malik', specialty: 'Pediatrician', imageUrl: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Monday', time: '15:00' }, { day: 'Thursday', time: '11:00' }] },
    { _id: '6emsu3kxpmlw0acvg', name: 'Dr. Faisal Qureshi', specialty: 'General Physician', imageUrl: 'https://images.unsplash.com/photo-1612531388300-1c05d7cb6a08?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Monday', time: '08:00' }, { day: 'Tuesday', time: '08:00' }, { day: 'Wednesday', time: '08:00' }] },
    { _id: 'k8j9l0m1n2o3p4q5r', name: 'Dr. Zainab Abidi', specialty: 'Optometrist', imageUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Monday', time: '11:00' }, { day: 'Wednesday', time: '11:00' }] },
    { _id: 's6t7u8v9w0x1y2z3a', name: 'Dr. Kamran Akmal', specialty: 'Dentist', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Tuesday', time: '02:00' }, { day: 'Thursday', time: '02:00' }] },
    { _id: 'b4c5d6e7f8g9h0i1j', name: 'Dr. Maria B', specialty: 'Psychiatrist', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Wednesday', time: '03:00' }, { day: 'Friday', time: '03:00' }] },
    { _id: 'l2m3n4o5p6q7r8s9t', name: 'Dr. Omer Saeed', specialty: 'Radiologist', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Monday', time: '10:00' }, { day: 'Wednesday', time: '10:00' }] },
    { _id: 'u0v1w2x3y4z5a6b7c', name: 'Dr. Fatima Jinnah', specialty: 'Oncologist', imageUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop', availableSlots: [{ day: 'Tuesday', time: '09:00' }, { day: 'Friday', time: '09:00' }] },
];

const seedDoctors = async () => {
    const count = await Doctor.countDocuments();
    if (count < DOCTORS_SEED.length) {
        await Doctor.deleteMany({});
        await Doctor.insertMany(DOCTORS_SEED);
    }
};

const resolveDoctorImageUrl = async (doctorName, doctorImageUrl) => {
    if (doctorImageUrl) return doctorImageUrl;
    const doctor = await Doctor.findOne({ name: doctorName });
    return doctor?.imageUrl || DEFAULT_DOCTOR_IMAGE;
};

const isActiveStatusFilter = { $nin: ['Cancelled'] };

const resolveDoctorImages = async (appointments) => {
    try {
        const resolved = [];
        for (let appt of appointments) {
            const apptObj = typeof appt.toObject === 'function' ? appt.toObject() : { ...appt };
            if (!apptObj.doctorImageUrl) {
                const doctor = await Doctor.findOne({ name: apptObj.doctorName });
                if (doctor && doctor.imageUrl) {
                    apptObj.doctorImageUrl = doctor.imageUrl;
                }
            }
            resolved.push(apptObj);
        }
        return resolved;
    } catch (err) {
        console.error('Error resolving doctor images:', err);
        return appointments;
    }
};

// GET /api/appointments/doctors
exports.getDoctors = async (req, res) => {
    try {
        await seedDoctors();
        const doctors = await Doctor.find({});
        return res.json({ doctors });
    } catch (error) {
        console.error('GET DOCTORS ERROR:', error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// POST /api/appointments/book
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorName, specialty, date, time, doctorImageUrl } = req.body;
        const userId = req.userId;

        if (!doctorName || !date || !time) {
            return res.status(400).json({ message: 'Doctor, date, and time are required' });
        }

        const clash = await Appointment.findOne({
            doctorName,
            date,
            time,
            status: isActiveStatusFilter,
        });
        if (clash) {
            return res.status(409).json({ message: 'Slot unavailable. This time slot is already booked.' });
        }

        const userClash = await Appointment.findOne({
            userId,
            date,
            time,
            status: isActiveStatusFilter,
        });
        if (userClash) {
            return res.status(409).json({ message: 'You already have an appointment at this date and time.' });
        }

        const finalImageUrl = await resolveDoctorImageUrl(doctorName, doctorImageUrl);
        const appointment = await Appointment.create({
            userId,
            doctorName,
            specialty: specialty || 'General',
            doctorImageUrl: finalImageUrl,
            date,
            time,
            status: 'Confirmed',
        });

        await createNotification(
            userId,
            'Appointment Booked',
            `Your appointment with ${doctorName} is confirmed for ${date} at ${time}.`,
            'appointment'
        );

        return res.status(201).json({ message: 'Appointment booked successfully', appointment });
    } catch (error) {
        console.error('BOOK APPOINTMENT ERROR:', error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// PUT /api/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res) => {
    try {
        const { doctorName, specialty, date, time, doctorImageUrl } = req.body;
        const userId = req.userId;
        const appointmentId = req.params.id;

        if (!doctorName || !date || !time) {
            return res.status(400).json({ message: 'Doctor, date, and time are required' });
        }

        const currentAppointment = await Appointment.findOne({ _id: appointmentId, userId });
        if (!currentAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const clash = await Appointment.findOne({
            _id: { $ne: appointmentId },
            doctorName,
            date,
            time,
            status: isActiveStatusFilter,
        });
        if (clash) {
            return res.status(409).json({ message: 'Slot unavailable. This time slot is already booked.' });
        }

        const userClash = await Appointment.findOne({
            _id: { $ne: appointmentId },
            userId,
            date,
            time,
            status: isActiveStatusFilter,
        });
        if (userClash) {
            return res.status(409).json({ message: 'You already have an appointment at this date and time.' });
        }

        currentAppointment.doctorName = doctorName;
        currentAppointment.specialty = specialty || currentAppointment.specialty || 'General';
        currentAppointment.date = date;
        currentAppointment.time = time;
        currentAppointment.doctorImageUrl = await resolveDoctorImageUrl(doctorName, doctorImageUrl);
        currentAppointment.status = 'Confirmed';
        await currentAppointment.save();

        await createNotification(
            userId,
            'Appointment Rescheduled',
            `Your appointment has been moved to ${date} at ${time} with ${doctorName}.`,
            'appointment'
        );

        return res.json({ message: 'Appointment rescheduled successfully', appointment: currentAppointment });
    } catch (error) {
        console.error('RESCHEDULE APPOINTMENT ERROR:', error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// GET /api/appointments/upcoming
exports.getUpcoming = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const appointments = await Appointment.find({
            userId: req.userId,
            date: { $gte: today },
            status: isActiveStatusFilter,
        }).sort({ date: 1, time: 1 });

        const resolved = await resolveDoctorImages(appointments);
        return res.json({ appointments: resolved });
    } catch (error) {
        console.error('GET UPCOMING ERROR:', error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// GET /api/appointments/history
exports.getHistory = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const appointments = await Appointment.find({
            userId: req.userId,
            $or: [
                { date: { $lt: today } },
                { status: 'Cancelled' },
            ],
        }).sort({ date: -1, time: -1 });

        const resolved = await resolveDoctorImages(appointments);

        const updated = resolved.map((appt) => {
            if (appt.date < today && appt.status === 'Confirmed') {
                appt.status = 'Completed';
            }
            return appt;
        });

        return res.json({ appointments: updated });
    } catch (error) {
        console.error('GET HISTORY ERROR:', error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
    try {
        const appt = await Appointment.findOne({ _id: req.params.id, userId: req.userId });
        if (!appt) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appt.status = 'Cancelled';
        await appt.save();
        await createNotification(
            req.userId,
            'Appointment Cancelled',
            `Your appointment with ${appt.doctorName} on ${appt.date} has been cancelled.`,
            'appointment'
        );

        return res.json({ message: 'Appointment cancelled', appointment: appt });
    } catch (error) {
        console.error('CANCEL APPOINTMENT ERROR:', error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// GET /api/appointments/all
exports.getAll = async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.userId }).sort({ date: -1, time: -1 });
        const today = new Date().toISOString().split('T')[0];

        const resolved = await resolveDoctorImages(appointments);

        const updated = resolved.map((appt) => {
            if (appt.date < today && appt.status === 'Confirmed') {
                appt.status = 'Completed';
            }
            return appt;
        });

        return res.json({ appointments: updated });
    } catch (error) {
        console.error('GET ALL APPOINTMENTS ERROR:', error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
