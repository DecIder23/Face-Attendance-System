const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Class = sequelize.define('Class', {
        name: {
            type: DataTypes.STRING,
            allowNull: true, // Making it nullable as it's not provided by the form
            unique: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        department: {
            type: DataTypes.STRING,
            allowNull: false
        },
        batch: {
            type: DataTypes.STRING,
            allowNull: false
        },
        semester: {
            type: DataTypes.STRING,
            allowNull: false
        }
        // section field removed
    });

    return Class;
};
