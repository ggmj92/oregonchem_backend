const { sendContactEmail } = require('../../services/emailService');

exports.sendContactMessage = async (req, res) => {
    console.log('=== Contact form submission received ===');
    console.log('Request body:', req.body);

    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            console.log('Missing required fields:', { name: !!name, email: !!email, message: !!message });
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        console.log('Calling sendContactEmail...');
        await sendContactEmail({
            name,
            email,
            phone: phone || '',
            message
        });

        console.log('Email sent successfully, sending response...');
        return res.status(200).json({
            success: true,
            message: 'Mensaje enviado exitosamente.'
        });
    } catch (error) {
        console.error('Error sending contact message:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
};
