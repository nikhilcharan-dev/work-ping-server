import express from 'express';

export const createRoutes = (controller) => {
    const router = express.Router();

    router.post('/setup', (req, res) => controller.setup(req, res));
    router.post('/verify', (req, res) => controller.verify(req, res));
    router.post('/validate', (req, res) => controller.validate(req, res));

    return router;
};
