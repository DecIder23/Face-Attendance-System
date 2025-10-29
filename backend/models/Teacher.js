const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const Teacher = sequelize.define('Teacher', {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        department: {
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

    Teacher.beforeCreate(async (teacher) => {
        if (teacher.password) {
            teacher.password = await bcrypt.hash(teacher.password, 10);
        }
    });

    return Teacher;
};
