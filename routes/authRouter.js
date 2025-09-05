const express = require('express');
const authRouter = express.Router();
const {getAdminLogin, postAdminLogin, postAdminLogout} = require('../controllers/authController');

authRouter.get('/admin-login', getAdminLogin);
authRouter.post('/admin-login', postAdminLogin);
authRouter.post('/admin-logout', postAdminLogout);

module.exports = authRouter;