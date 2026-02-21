// controllers/records.controller.js
const MedicalRecord = require('../models/MedicalRecord');
const { createNotification } = require('./notification.controller');

// GET /api/records
exports.getRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ records });
    } catch (error) {
        console.error('❌ GET RECORDS ERROR:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// POST /api/records/add
exports.addRecord = async (req, res) => {
    try {
        const { title, description, fileUrl, recordType } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const record = await MedicalRecord.create({
            userId: req.userId,
            title,
            description: description || '',
            fileUrl: fileUrl || '',
            recordType: recordType || 'Other',
        });

        await createNotification(
            req.userId,
            'New Medical Record',
            `A new ${recordType || 'document'} "${title}" has been added to your records.`,
            'record'
        );

        res.status(201).json({ message: 'Medical record added successfully', record });
    } catch (error) {
        console.error('❌ ADD RECORD ERROR:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// DELETE /api/records/:id
exports.deleteRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findOne({ _id: req.params.id, userId: req.userId });
        if (!record) return res.status(404).json({ message: 'Record not found' });
        await record.deleteOne();
        res.json({ message: 'Record deleted' });
    } catch (error) {
        console.error('❌ DELETE RECORD ERROR:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
