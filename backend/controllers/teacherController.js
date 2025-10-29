const { Teacher } = require('../models');

exports.createTeacher = async (req, res) => {
    try {
        const teacherData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password,
            department: req.body.department,
            fatherName: req.body.fatherName,
            cnic: req.body.cnic,
            dateOfBirth: req.body.dateOfBirth,
            gender: req.body.gender,
            address: req.body.address,
            emergencyContact: req.body.emergencyContact
        };

        if (req.body.photos && Array.isArray(req.body.photos)) {
            teacherData.photos = req.body.photos;
        } else {
            teacherData.photos = [];
        }

        const newTeacher = await Teacher.create(teacherData);
        res.status(201).json(newTeacher);
    } catch (error) {
        console.error('Error creating teacher:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.findAll();
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id, {
            attributes: [
                'id', 'firstName', 'lastName', 'email', 'phone', 'department',
                'fatherName', 'cnic', 'dateOfBirth', 'gender', 'address', 'emergencyContact', 'photos', 'createdAt', 'updatedAt'
            ]
        });
        if (teacher) {
            res.status(200).json(teacher);
        } else {
            res.status(404).json({ error: 'Teacher not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTeacher = async (req, res) => {
    try {
        
        const [updated] = await Teacher.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedTeacher = await Teacher.findByPk(req.params.id);
            res.status(200).json(updatedTeacher);
        } else {
            res.status(404).json({ error: 'Teacher not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTeacherProfile = async (req, res) => {
    try {
        // req.user is set by the protect middleware
        console.log('Fetching teacher profile for user ID:', req.user.id);
        const teacher = await Teacher.findByPk(req.user.id, {
            attributes: [
                'id', 'firstName', 'lastName', 'email', 'phone', 'department',
                'fatherName', 'cnic', 'dateOfBirth', 'gender', 'address', 'emergencyContact', 'photos', 'createdAt', 'updatedAt'
            ]
        });
        if (teacher) {
            console.log('Teacher found:', teacher.toJSON());
            res.status(200).json({ teacher });
        } else {
            console.log('Teacher not found for user ID:', req.user.id);
            res.status(404).json({ error: 'Teacher profile not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTeacher = async (req, res) => {
    try {
        const deleted = await Teacher.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Teacher not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
