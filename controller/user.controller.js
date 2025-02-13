const { User, Otp } = require('../schema');
const { generateToken } = require('../tokenizer/token');
const bcrypt = require('bcrypt');
const { sendOtpEmail } = require('../utils/common');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

exports.welcome = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.registerUser = async (req, res) => {
    try {
        let { name, lastname, email, password, confirmpassword, profile, email_otp } = req.body;

        if (!email || !password || !confirmpassword) {
            return res.status(400).json({ success: false, message: 'Email, password, and confirm password are required' });
        }

        email = email.trim().toLowerCase();

        if (password !== confirmpassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // OTP validation (Uncomment if required)
        // const otpRecord = await Otp.findOne({ where: { email } });
        // if (!otpRecord || otpRecord.otp !== email_otp) {
        //     return res.status(400).json({ success: false, message: 'Invalid OTP' });
        // }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name?.trim(),
            lastname: lastname?.trim(),
            email,
            password: hashedPassword,
            profile: profile || '',
            role: 2
        });

        return  res.status(200).json({ 
            success: true, 
            message: 'User registered successfully',
            userId: newUser.id
        });
    } catch (error) {
        console.error('Error in registerUser:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.loginUser = async (req, res) => {
    const { type, email, password, name } = req.body;

    try {
        if (type === 'google') {
            let user = await User.findOne({ where: { email } });

            if (!user) {
                user = await User.create({
                    name,
                    email,
                    password: null,
                    type: 'google',
                    role: 2
                });
            } else {
                const token = generateToken(user.id);
                return res.status(200).json({ success: true, message: 'Email already exist', token });
                // return res.status(200).json({ success: true, message: 'Email already exist' });

            }

            const token = generateToken(user.id);
            return res.status(200).json({ success: true, message: 'Login successful', token });
        } else {

            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.status(200).json({ success: false, message: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(200).json({ success: false, message: 'Invalid Password' });
            }

            const token = generateToken(user.id);
            return res.status(200).json({ success: true, message: 'Login successful', token });
        }
    } catch (error) {
        return res.status(200).json({ success: false, message: error.message });
    }
};

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const existingOtp = await Otp.findOne({ where: { email } });

        if (existingOtp) {
            await Otp.update({ otp }, { where: { email } });
            console.log(`Updated OTP for ${email}`);
        } else {
            await Otp.create({ email, otp });
            console.log(`Created new OTP for ${email}`);
        }

        await sendOtpEmail(email, otp);

        return res.status(200).json({ success: true, message: 'Mail sent successfully', email: email });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(200).json({ success: false, message: 'Admin Does not exist' });
        }

        if (user.role !== 1) {
            return res.status(403).json({ success: false, message: 'Admin Does not exist' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const accessToken = generateToken(user.id, user.role);

        return res.status(200).json({ success: true, message: 'Admin login successful', data: { accessToken, user: { name: user.name, email: user.email } } });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.uploadImage = async (req, res) => {
    try {
        upload.array('images', 10)(req, res, (err) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            const baseUrl = "http://192.168.1.16:3000"; // Change PORT as needed

            const files = req.files.map(file => ({
                filename: file.filename,
                path: file.path,
                url: `${baseUrl}/${file.path}` // Full URL
            }));

            return res.status(200).json({ success: true, message: 'Image(s) uploaded successfully', files });
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};