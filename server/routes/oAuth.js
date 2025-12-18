import { Router } from 'express';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

    } catch(err) {
        console.log(err);
    }
});

router.post('/login', async (req, res) => {
    try {

    } catch(err) {
        console.log(err);
    }
});

export default router;