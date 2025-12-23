const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');

const mailersend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_TOKEN,
});

console.log('MailerSend Configuration:', {
    apiKeySet: !!process.env.MAILERSEND_API_TOKEN,
    from: process.env.SMTP_FROM || 'contacto@quimicaindustrial.pe'
});

const loadTemplate = (templateName) => {
    const templatePath = path.join(__dirname, '../templates', templateName);
    const template = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(template);
};

let companyTemplate;
let clientTemplate;

const getCompanyTemplate = () => {
    if (!companyTemplate) {
        companyTemplate = loadTemplate('quimicaindustrialpe/company-notification.html');
    }
    return companyTemplate;
};

const getClientTemplate = () => {
    if (!clientTemplate) {
        clientTemplate = loadTemplate('quimicaindustrialpe/client-confirmation.html');
    }
    return clientTemplate;
};

const isEmailRedirectEnabled = () => {
    const redirectAllTo = process.env.EMAIL_REDIRECT_ALL_TO;
    if (!redirectAllTo) return false;

    const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase();
    const isProd = nodeEnv === 'production';
    if (!isProd) return true;

    return String(process.env.ALLOW_EMAIL_REDIRECT_IN_PROD || '').toLowerCase() === 'true';
};

const getContactRecipients = (contact) => {
    const defaultCompanyTo = 'contacto@quimicaindustrial.pe';
    const redirectAllTo = isEmailRedirectEnabled() ? process.env.EMAIL_REDIRECT_ALL_TO : undefined;
    const companyTo = redirectAllTo || process.env.CONTACT_COMPANY_TO || defaultCompanyTo;
    const clientTo = redirectAllTo || process.env.CONTACT_CLIENT_TO || contact.email;
    return { companyTo, clientTo };
};

const getEmailRecipients = (quote) => {
    const defaultCompanyTo = 'contacto@quimicaindustrial.pe';
    const redirectAllTo = isEmailRedirectEnabled() ? process.env.EMAIL_REDIRECT_ALL_TO : undefined;
    const companyTo = redirectAllTo || process.env.QUOTE_COMPANY_TO || defaultCompanyTo;
    const clientTo = redirectAllTo || process.env.QUOTE_CLIENT_TO || quote.email;
    return { companyTo, clientTo };
};

const sendContactEmail = async (contact) => {
    try {
        console.log('Starting sendContactEmail with MailerSend API...');
        const { companyTo, clientTo } = getContactRecipients(contact);
        console.log('Recipients:', { companyTo, clientTo });

        const fromAddress = process.env.SMTP_FROM || 'contacto@quimicaindustrial.pe';
        console.log('From address:', fromAddress);

        const sentFrom = new Sender(fromAddress, 'Química Industrial Perú');

        // Send email to company
        console.log('Sending email to company...');
        const emailParamsCompany = new EmailParams()
            .setFrom(sentFrom)
            .setTo([new Recipient(companyTo)])
            .setReplyTo(new Recipient(contact.email, contact.name))
            .setSubject(`Nuevo mensaje de contacto - ${contact.name}`)
            .setHtml(`
                <h2>Nuevo mensaje de contacto</h2>
                <p><strong>Nombre:</strong> ${contact.name}</p>
                <p><strong>Email:</strong> ${contact.email}</p>
                <p><strong>Teléfono:</strong> ${contact.phone || '-'}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${String(contact.message).replace(/\n/g, '<br/>')}</p>
            `);

        await mailersend.email.send(emailParamsCompany);
        console.log('Company email sent successfully');

        // Send confirmation email to client
        console.log('Sending confirmation email to client...');
        const emailParamsClient = new EmailParams()
            .setFrom(sentFrom)
            .setTo([new Recipient(clientTo)])
            .setSubject('Confirmación de contacto - Química Industrial Perú')
            .setHtml(`
                <p>Hola ${contact.name},</p>
                <p>Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos pronto.</p>
                <hr/>
                <p><strong>Tu mensaje:</strong></p>
                <p>${String(contact.message).replace(/\n/g, '<br/>')}</p>
                <hr/>
                <p>Química Industrial Perú</p>
                <p>contacto@quimicaindustrial.pe</p>
            `);

        await mailersend.email.send(emailParamsClient);
        console.log('Client confirmation email sent successfully');

        return true;
    } catch (error) {
        console.error('Error sending contact emails:', error);
        console.error('Error details:', {
            message: error.message,
            body: error.body,
            statusCode: error.statusCode
        });
        throw error;
    }
};

const sendQuoteEmail = async (quote, pdfBuffer) => {
    try {
        const frequencyLabels = {
            'unica': 'Única compra',
            'quincenal': 'Quincenal',
            'mensual': 'Mensual',
            'bimestral': 'Bimestral',
            'trimestral': 'Trimestral'
        };

        const formattedProducts = quote.products.map((product, index) => `
            <div class="product-item" style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                <p style="margin: 5px 0;"><strong>Producto ${index + 1}:</strong> ${product.productName}</p>
                <p style="margin: 5px 0;"><strong>Presentación:</strong> ${product.presentationLabel || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Cantidad:</strong> ${product.quantity}</p>
                <p style="margin: 5px 0;"><strong>Frecuencia:</strong> ${frequencyLabels[product.frequency] || product.frequency}</p>
            </div>
        `).join('');

        const contactPrefs = [];
        if (quote.contactPreferences.email) contactPrefs.push('Email');
        if (quote.contactPreferences.whatsapp) contactPrefs.push('WhatsApp');
        if (quote.contactPreferences.phone) contactPrefs.push('Llamada');

        const clientName = `${quote.firstName} ${quote.lastName}`;
        const clientInfo = {
            name: quote.firstName,
            lastname: quote.lastName,
            email: quote.email,
            phone: quote.phone,
            company: quote.companyName || '',
            ruc: quote.ruc || ''
        };

        const observationsText = String(quote.observations || '').trim();
        const { companyTo, clientTo } = getEmailRecipients(quote);

        const companyName = process.env.COMPANY_NAME || 'Química Industrial Perú';
        const companyAddress = process.env.COMPANY_ADDRESS || 'Lima, Perú';
        const companyPhone = process.env.COMPANY_PHONE || '+51 1 234 5678';
        const companyEmail = process.env.COMPANY_EMAIL || 'contacto@quimicaindustrial.pe';

        const fromAddress = process.env.SMTP_FROM || 'contacto@quimicaindustrial.pe';
        const sentFrom = new Sender(fromAddress, companyName);

        // Send email to company with PDF attachment
        const emailParamsCompany = new EmailParams()
            .setFrom(sentFrom)
            .setTo([new Recipient(companyTo)])
            .setSubject(`Nueva Cotización - ${clientName}`)
            .setHtml(getCompanyTemplate()({
                logo: process.env.COMPANY_LOGO_URL || 'https://quimicaindustrial.pe/logo.png',
                quoteId: quote._id,
                date: new Date(quote.createdAt).toLocaleDateString('es-PE'),
                clientInfo,
                contactMethod: contactPrefs.join(', '),
                products: formattedProducts,
                observations: observationsText,
                companyName,
                companyAddress,
                companyPhone,
                companyEmail
            }))
            .setAttachments([{
                content: pdfBuffer.toString('base64'),
                filename: `cotizacion-${quote._id}.pdf`,
                disposition: 'attachment'
            }]);

        await mailersend.email.send(emailParamsCompany);

        // Send confirmation email to client
        const emailParamsClient = new EmailParams()
            .setFrom(sentFrom)
            .setTo([new Recipient(clientTo)])
            .setSubject('Confirmación de Cotización - Química Industrial Perú')
            .setHtml(getClientTemplate()({
                logo: process.env.COMPANY_LOGO_URL || 'https://quimicaindustrial.pe/logo.png',
                clientName: clientName,
                quoteId: quote._id,
                date: new Date(quote.createdAt).toLocaleDateString('es-PE'),
                products: formattedProducts,
                observations: observationsText,
                companyName,
                companyAddress,
                companyPhone,
                companyEmail
            }));

        await mailersend.email.send(emailParamsClient);

        return true;
    } catch (error) {
        console.error('Error sending quote emails:', error);
        throw error;
    }
};

module.exports = {
    sendContactEmail,
    sendQuoteEmail
};
