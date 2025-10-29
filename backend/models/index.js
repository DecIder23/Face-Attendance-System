const { Sequelize, DataTypes } = require('sequelize');
const defineUserModel = require('./User');
const defineClassModel = require('./Class');
const defineSubjectModel = require('./Subject');
const defineTeacherModel = require('./Teacher');
const defineStudentModel = require('./Student');
const defineLectureScheduleModel = require('./LectureSchedule');
const defineCameraModel = require('./Camera');
const defineAttendanceSessionModel = require('./AttendanceSession');
const defineAttendanceModel = require('./Attendance');

const sequelize = new Sequelize('fyp_backend', 'postgres', 'admin', {
    host: 'localhost',
    port: 9000,
    dialect: 'postgres'
});

const User = defineUserModel(sequelize);
const Class = defineClassModel(sequelize);
const Subject = defineSubjectModel(sequelize);
const Teacher = defineTeacherModel(sequelize);
const Student = defineStudentModel(sequelize);
const LectureSchedule = defineLectureScheduleModel(sequelize);
const Camera = defineCameraModel(sequelize);
const AttendanceSession = defineAttendanceSessionModel(sequelize);
const Attendance = defineAttendanceModel(sequelize);

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = User;
db.Class = Class;
db.Subject = Subject;
db.Teacher = Teacher;
db.Student = Student;
db.LectureSchedule = LectureSchedule;
db.Camera = Camera;
db.AttendanceSession = AttendanceSession;
db.Attendance = Attendance;

// Define associations
Class.hasMany(Student, { foreignKey: 'classId' });
Student.belongsTo(Class, { foreignKey: 'classId' });
Class.hasMany(Subject, { foreignKey: 'classId' });
Subject.belongsTo(Class, { foreignKey: 'classId' });

module.exports = db;
