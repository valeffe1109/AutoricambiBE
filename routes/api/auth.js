const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const Admin = require('../../models/Admin');

// @route    GET api/auth
// @desc     Test route
// @access   Public
router.get('/', auth, async (req, res) => {
	try {
		const Admin = await Admin.findById(req.Admin.id).select('-password');
		res.json(Admin);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route    POST api/auth
// @desc     Authenticate Admin & get token
// @access   Public
router.post(
	'/',
	[ check('email', 'Please include a valid email').isEmail(), check('password', 'Password is required').exists() ],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { email, password } = req.body;

		try {
			let Admin = await Admin.findOne({ email });

			if (!Admin) {
				return res.status(400).json({ errors: [ { msg: 'Invalid Credentials' } ] });
			}

			const isMatch = await bcrypt.compare(password, Admin.password);

			if (!isMatch) {
				return res.status(400).json({ errors: [ { msg: 'Invalid Credentials' } ] });
			}

			const payload = {
				Admin: {
					id: Admin.id
				}
			};

			jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 360000 }, (err, token) => {
				if (err) throw err;
				res.json({ token });
			});
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server error');
		}
	}
);

module.exports = router;
