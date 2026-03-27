// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { login, createAdmin, listAdmins, deleteAdmin } = require('../controllers/adminController');

router.post('/login', login);
router.get('/', listAdmins);
router.post('/', createAdmin);
router.delete('/:id', deleteAdmin);

module.exports = router;
