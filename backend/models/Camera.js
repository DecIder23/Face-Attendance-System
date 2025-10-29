const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Camera = sequelize.define('Camera', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        ipAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isIP: true
            }
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    return Camera;
};
