const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Attendance = sequelize.define('Attendance', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        student_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        student_email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        subject: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        time_in: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.ENUM('present', 'absent'),
            allowNull: false,
            defaultValue: 'present',
            validate: {
                isIn: [['present', 'absent']]
            }
        },
        markedBy: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        // End of fields
    }, {
        tableName: 'attendance',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['student_name', 'date'],
                name: 'unique_student_date'
            },
            {
                fields: ['date'],
                name: 'idx_attendance_date'
            },
            {
                fields: ['student_name'],
                name: 'idx_attendance_student_name'
            }
        ]
    });

    return Attendance;
};
