const { sendContactEmail } = require('../../services/emailService');

exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        await sendContactEmail({
            name,
            email,
            phone: phone || '',
            message
        });

        return res.status(200).json({
            success: true,
            message: 'Mensaje enviado exitosamente.'
        });
    } catch (error) {
        console.error('Error sending contact message:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
};
