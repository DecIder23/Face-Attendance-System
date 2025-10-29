const { Camera } = require('../models');

exports.createCamera = async (req, res) => {
    try {
        const newCamera = await Camera.create(req.body);
        res.status(201).json(newCamera);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllCameras = async (req, res) => {
    try {
        const cameras = await Camera.findAll();
        res.status(200).json(cameras);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCameraById = async (req, res) => {
    try {
        const camera = await Camera.findByPk(req.params.id);
        if (camera) {
            res.status(200).json(camera);
        } else {
            res.status(404).json({ error: 'Camera not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCamera = async (req, res) => {
    try {
        const [updated] = await Camera.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedCamera = await Camera.findByPk(req.params.id);
            res.status(200).json(updatedCamera);
        } else {
            res.status(404).json({ error: 'Camera not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteCamera = async (req, res) => {
    try {
        const deleted = await Camera.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Camera not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
