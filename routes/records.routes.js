const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const { getRecords, addRecord, deleteRecord } = require('../controllers/records.controller');

router.get('/', protect, getRecords);
router.post('/add', protect, addRecord);
router.delete('/:id', protect, deleteRecord);

module.exports = router;
