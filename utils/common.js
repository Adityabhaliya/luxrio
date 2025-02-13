const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "adityabhaliya418@gmail.com",
        pass: "alnijjprulsubutt",
    },
    tls: {
        rejectUnauthorized: false,
    },
});

const sendOtpEmail = async (email, otp) => {
    console.log(process.env.NEXT_PUBLIC_EMAIL);
    console.log(email);
    console.log(otp);

    try {
        const mailOptions = {
            from: "adityabhaliya418@gmail.com",
            to: email,
            subject: "🔐 Your OTP Code for Password Reset",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px;">
                    <h2 style="color: #333;">Hello,</h2>
                    <p style="font-size: 16px; color: #555;">
                        You requested a password reset. Click the button below to proceed:
                    </p>
                    <a href="http://localhost:3001/resetpassword" 
                        style="display: inline-block; background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; margin: 10px 0;">
                        Reset Password
                    </a>
                    <p style="font-size: 14px; color: #777;">
                        If you did not request this, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #aaa;">
                        This is an automated message. Please do not reply.
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error('Error sending OTP email:', error.message);
        throw new Error('Error sending OTP');
    }
};



const paginate = async (model, page = 1, size = 10, where = {}) => {
    const limit = parseInt(size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const { count, rows } = await model.findAndCountAll({
        where,
        limit,
        offset,
    });

    return {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
        data: rows,
    };
};


module.exports = { sendOtpEmail, paginate };