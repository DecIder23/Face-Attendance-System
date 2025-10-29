const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Subject = sequelize.define('Subject', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        teacherId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        teacherName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        classId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    return Subject;
};
