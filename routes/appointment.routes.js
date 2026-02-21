const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
    bookAppointment,
    getUpcoming,
    getHistory,
    cancelAppointment,
    getDoctors,
    getAll,
} = require('../controllers/appointment.controller');

// All routes protected
router.get('/doctors', protect, getDoctors);
router.post('/book', protect, bookAppointment);
router.get('/upcoming', protect, getUpcoming);
router.get('/history', protect, getHistory);
router.get('/all', protect, getAll);
router.put('/:id/cancel', protect, cancelAppointment);

module.exports = router;
