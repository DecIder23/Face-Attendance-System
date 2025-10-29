const { Class } = require('../models');

exports.createClass = async (req, res) => {
    try {
        const newClass = await Class.create(req.body);
        res.status(201).json(newClass);
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await Class.findAll();
        res.status(200).json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getClassById = async (req, res) => {
    try {
        const classItem = await Class.findByPk(req.params.id);
        if (classItem) {
            res.status(200).json(classItem);
        } else {
            res.status(404).json({ error: 'Class not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const [updated] = await Class.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedClass = await Class.findByPk(req.params.id);
            res.status(200).json(updatedClass);
        } else {
            res.status(404).json({ error: 'Class not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const deleted = await Class.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Class not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
