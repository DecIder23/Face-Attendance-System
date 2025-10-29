const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const Student = sequelize.define('Student', {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        studentId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        department: {
            type: DataTypes.STRING,
            allowNull: true
        },
        batch: {
            type: DataTypes.STRING,
            allowNull: true
        },
        semester: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 8
            }
        },
        section: {
            type: DataTypes.STRING,
            allowNull: true
        },
        fatherName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        cnic: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        dateOfBirth: {
            type: DataTypes.STRING,
            allowNull: true
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        emergencyContact: {
            type: DataTypes.STRING,
            allowNull: true
        },
        photos: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('photos');
                return rawValue ? JSON.parse(rawValue) : [];
            },
            set(value) {
                this.setDataValue('photos', JSON.stringify(value));
            }
        }
    });

    Student.beforeCreate(async (student) => {
        if (student.password) {
            student.password = await bcrypt.hash(student.password, 10);
        }
    });

    return Student;
};
