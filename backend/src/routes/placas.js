const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { buscar, detectarIA } = require('../controllers/placasController');

router.post('/buscar', auth, buscar);
router.post('/detectar-ia', auth, detectarIA);

module.exports = router;