const db = require('../models');
const { Subject, Class, Teacher } = db;

// Create Subject with teacherName
exports.createSubject = async (req, res) => {
    try {
        let teacherName = null;
        if (req.body.teacherId) {
            const teacher = await Teacher.findByPk(req.body.teacherId);
            if (teacher) {
                teacherName = teacher.firstName + ' ' + teacher.lastName;
            }
        }
        const newSubject = await Subject.create({
            ...req.body,
            teacherName
        });
        res.status(201).json(newSubject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all subjects (teacherName included)
exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.findAll();
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get subject by ID (teacherName included)
exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findByPk(req.params.id);
        if (subject) {
            res.status(200).json(subject);
        } else {
            res.status(404).json({ error: 'Subject not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update subject and teacherName
exports.updateSubject = async (req, res) => {
    try {
        let teacherName = null;
        if (req.body.teacherId) {
            const teacher = await Teacher.findByPk(req.body.teacherId);
            if (teacher) {
                teacherName = teacher.firstName + ' ' + teacher.lastName;
            }
        }
        const [updated] = await Subject.update({
            ...req.body,
            teacherName
        }, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedSubject = await Subject.findByPk(req.params.id);
            res.status(200).json(updatedSubject);
        } else {
            res.status(404).json({ error: 'Subject not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete subject
exports.deleteSubject = async (req, res) => {
    try {
        const deleted = await Subject.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Subject not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
