const { Student } = require('../models');

exports.createStudent = async (req, res) => {
    try {
        // Debug log to verify incoming data
        console.log('Received student data:', req.body);
        const studentData = { ...req.body };
        // Explicitly map all expected fields
        studentData.firstName = req.body.firstName;
        studentData.lastName = req.body.lastName;
        studentData.studentId = req.body.studentId;
        studentData.fatherName = req.body.fatherName;
        studentData.cnic = req.body.cnic;
        studentData.email = req.body.email;
        studentData.password = req.body.password;
        studentData.phone = req.body.phone;
        studentData.department = req.body.department;
        studentData.batch = req.body.batch;
        // Convert semester to integer if it exists
        if (req.body.semester && req.body.semester !== '') {
            studentData.semester = parseInt(req.body.semester, 10);
        } else {
            studentData.semester = null;
        }
        
        // Debug: Check if semester is being received and converted
        console.log('Semester received in backend:', req.body.semester);
        console.log('Semester type:', typeof req.body.semester);
        console.log('Semester converted:', studentData.semester);
        console.log('Semester converted type:', typeof studentData.semester);
        
        studentData.section = req.body.section;
        studentData.address = req.body.address;
        studentData.emergencyContact = req.body.emergencyContact;
        studentData.gender = req.body.gender;
        // Map 'dob' to 'dateOfBirth'
        if (req.body.dob) {
            studentData.dateOfBirth = req.body.dob;
        } else if (req.body.dateOfBirth) {
            studentData.dateOfBirth = req.body.dateOfBirth;
        }
        // Handle photos array
        if (req.body.photos && Array.isArray(req.body.photos)) {
            studentData.photos = req.body.photos;
        } else {
            studentData.photos = [];
        }
        // Remove any unused fields
        delete studentData.dob;

        const newStudent = await Student.create(studentData);
        res.status(201).json(newStudent);
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.findAll();
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id, {
            attributes: [
                'id', 'firstName', 'lastName', 'studentId', 'email', 'password', 'department', 'batch', 'semester', 'section',
                'fatherName', 'cnic', 'phone', 'dateOfBirth', 'gender', 'address', 'emergencyContact', 'photos', 'createdAt', 'updatedAt', 'classId'
            ]
        });
        if (student) {
            res.status(200).json(student);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const [updated] = await Student.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedStudent = await Student.findByPk(req.params.id);
            res.status(200).json(updatedStudent);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const deleted = await Student.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCurrentStudent = async (req, res) => {
    try {
        // Use email from JWT payload for lookup
        const student = await Student.findOne({
            where: { email: req.user.email },
            attributes: [
                'id', 'firstName', 'lastName', 'studentId', 'email', 'department', 'batch', 'classId'
            ]
        });
        if (student) {
            res.status(200).json(student);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
