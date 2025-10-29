const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttendanceSession = sequelize.define('AttendanceSession', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        subject: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        classId: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        filePath: {
            type: DataTypes.STRING(512),
            allowNull: true
        },
        present_students: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        absent_students: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        teacher_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'attendance_sessions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return AttendanceSession;
};
