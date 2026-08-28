const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { listar, crear, verificarVigente, eliminar } = require('../controllers/abonosController');
router.get('/', auth, listar);
router.get('/vigente/:moto_id', auth, verificarVigente);
router.post('/', auth, crear);
router.delete('/:id', auth, eliminar);
module.exports = router;
