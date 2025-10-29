const db = require('../models');
const { Op } = require('sequelize');
const LectureSchedules = db.LectureSchedule;

exports.createLectureSchedule = async (req, res) => {
    try {
        const newLectureSchedule = await LectureSchedules.create(req.body);
        res.status(201).json(newLectureSchedule);
    } catch (error) {
        console.error('Error in createLectureSchedule:', error); // Added detailed logging
        res.status(400).json({ error: error.message });
    }
};

exports.getAllLectureSchedules = async (req, res) => {
    try {
        const { department, batch, program } = req.query;
        let whereClause = {};

        // The primary filter uses the combined 'program' string (e.g., "BS SE 2022")
        if (program) {
            // Use iLike for a case-insensitive match.
            whereClause.program = { [Op.iLike]: program };
        } 
        // This is a fallback for any part of the system that might still send separate fields.
        else if (department && batch) {
            const programIdentifier = `${department.trim()} ${batch.trim()}`;
            whereClause.program = { [Op.iLike]: programIdentifier };
        }

        const lectureSchedules = await LectureSchedules.findAll({ where: whereClause });
        res.status(200).json(lectureSchedules);
    } catch (error) {
        console.error('Error in getAllLectureSchedules:', error);
        res.status(500).json({ error: error.message || 'Internal server error in getAllLectureSchedules.' });
    }
};

exports.getLectureScheduleById = async (req, res) => {
    try {
        const lectureSchedule = await LectureSchedules.findByPk(req.params.id);
        if (lectureSchedule) {
            res.status(200).json(lectureSchedule);
        } else {
            res.status(404).json({ error: 'Lecture Schedule not found' });
        }
    } catch (error) {
        console.error('Error in getLectureScheduleById:', error); // Added detailed logging
        res.status(500).json({ error: error.message });
    }
};

exports.updateLectureSchedule = async (req, res) => {
    try {
        const [updated] = await LectureSchedules.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedLectureSchedule = await LectureSchedules.findByPk(req.params.id);
            res.status(200).json(updatedLectureSchedule);
        } else {
            res.status(404).json({ error: 'Lecture Schedule not found' });
        }
    } catch (error) {
        console.error('Error in updateLectureSchedule:', error); // Added detailed logging
        res.status(400).json({ error: error.message });
    }
};

exports.deleteLectureSchedule = async (req, res) => {
    try {
        const deleted = await LectureSchedules.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Lecture Schedule not found' });
        }
    } catch (error) {
        console.error('Error in deleteLectureSchedule:', error); // Added detailed logging
        res.status(500).json({ error: error.message });
    }
};

// Delete a lecture schedule by slotId
exports.deleteLectureScheduleBySlotId = async (req, res) => {
    try {
        const { slotId } = req.params;
        const deleted = await LectureSchedules.destroy({
            where: { slotId: slotId }
        });

        // Return a 200 OK with a success message, regardless of whether a row was deleted.
        // This ensures the frontend receives a consistent JSON response.
        res.status(200).json({ message: 'Schedule slot processed successfully.' });
    } catch (error) {
        console.error('Error in deleteLectureScheduleBySlotId:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.bulkUploadLectureSchedules = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const schedules = req.body;
        if (!Array.isArray(schedules)) {
            return res.status(400).json({ error: 'Request body must be an array.' });
        }

        const upsertPromises = schedules.map(async (slot) => {
            const [startTime, endTime] = slot.timeSlot.split(' - ');

            const schedulePayload = {
                day: slot.day,
                startTime: startTime,
                endTime: endTime,
                timeSlot: slot.timeSlot,
                subjectName: slot.subjectName,
                teacherName: slot.teacherName,
                program: slot.program, // This is the department
                batch: slot.batch,
                semester: slot.semester, // Add semester
                room: slot.room,
                slotId: slot.slotId
            };

            const existingSchedule = await LectureSchedules.findOne({ where: { slotId: slot.slotId }, transaction: t });

            if (existingSchedule) {
                return await existingSchedule.update(schedulePayload, { transaction: t });
            } else {
                return await LectureSchedules.create(schedulePayload, { transaction: t });
            }
        });

        const results = await Promise.all(upsertPromises);
        await t.commit();
        return res.status(200).json({ message: 'Bulk upload successful', count: results.length });

    } catch (error) {
        await t.rollback();
        console.error('Error in bulkUploadLectureSchedules:', error);
        return res.status(500).json({ error: error.message });
    }
};
