const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Load email templates
const loadTemplate = (templateName) => {
    const templatePath = path.join(__dirname, '../templates', templateName);
    const template = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(template);
};

const sendContactEmail = async (contact) => {
    try {
        const { companyTo, clientTo } = getContactRecipients(contact);

        const fromAddress = process.env.SMTP_FROM || 'noreply@quimicaindustrial.pe';

        await transporter.sendMail({
            from: fromAddress,
            to: companyTo,
            replyTo: contact.email,
            subject: `Nuevo mensaje de contacto - ${contact.name}`,
            html: `
                <h2>Nuevo mensaje de contacto</h2>
                <p><strong>Nombre:</strong> ${contact.name}</p>
                <p><strong>Email:</strong> ${contact.email}</p>
                <p><strong>Teléfono:</strong> ${contact.phone || '-'}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${String(contact.message).replace(/\n/g, '<br/>')}</p>
            `
        });

        await transporter.sendMail({
            from: fromAddress,
            to: clientTo,
            subject: 'Confirmación de contacto - Química Industrial Perú',
            html: `
                <p>Hola ${contact.name},</p>
                <p>Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos pronto.</p>
                <hr/>
                <p><strong>Tu mensaje:</strong></p>
                <p>${String(contact.message).replace(/\n/g, '<br/>')}</p>
                <hr/>
                <p>Química Industrial Perú</p>
                <p>contacto@quimicaindustrial.pe</p>
            `
        });

        return true;
    } catch (error) {
        console.error('Error sending contact emails:', error);
        throw error;
    }
};

const companyTemplate = loadTemplate('quimicaindustrialpe/company-notification.html');
const clientTemplate = loadTemplate('quimicaindustrialpe/client-confirmation.html');

const isEmailRedirectEnabled = () => {
    const redirectAllTo = process.env.EMAIL_REDIRECT_ALL_TO;
    if (!redirectAllTo) return false;

    const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase();
    const isProd = nodeEnv === 'production';
    if (!isProd) return true;

    return String(process.env.ALLOW_EMAIL_REDIRECT_IN_PROD || '').toLowerCase() === 'true';
};

const resolveLogoBuffer = async () => {
    const logoPath = process.env.COMPANY_LOGO_PATH;
    const logoUrl = process.env.COMPANY_LOGO_URL;
    const fallbackPath = path.join(__dirname, '../../public/qiLogo.png');

    try {
        if (logoPath) {
            return fs.readFileSync(logoPath);
        }
    } catch (error) {
        console.warn('Email logo file not found:', error.message);
    }

    try {
        if (logoUrl && /^https?:\/\//i.test(logoUrl)) {
            const res = await fetch(logoUrl);
            if (res.ok) {
                const arr = await res.arrayBuffer();
                return Buffer.from(arr);
            }
        }
    } catch (error) {
        console.warn('Email logo URL not accessible:', error.message);
    }

    try {
        return fs.readFileSync(fallbackPath);
    } catch (error) {
        console.warn('Email fallback logo not found:', error.message);
    }

    return null;
};

const getEmailRecipients = (quote) => {
    const defaultCompanyTo = 'contacto@quimicaindustrial.pe';

    const redirectAllTo = isEmailRedirectEnabled() ? process.env.EMAIL_REDIRECT_ALL_TO : undefined;

    const companyTo = redirectAllTo || process.env.QUOTE_COMPANY_TO || defaultCompanyTo;
    const clientTo = redirectAllTo || process.env.QUOTE_CLIENT_TO || quote.email;

    return { companyTo, clientTo };
};

function getContactRecipients(contact) {
    const defaultCompanyTo = 'contacto@quimicaindustrial.pe';

    const redirectAllTo = isEmailRedirectEnabled() ? process.env.EMAIL_REDIRECT_ALL_TO : undefined;

    const companyTo = redirectAllTo || process.env.CONTACT_COMPANY_TO || defaultCompanyTo;
    const clientTo = redirectAllTo || process.env.CONTACT_CLIENT_TO || contact.email;

    return { companyTo, clientTo };
}

const sendQuoteEmail = async (quote, pdfBuffer) => {
    try {
        const frequencyLabels = {
            'unica': 'Única compra',
            'quincenal': 'Quincenal',
            'mensual': 'Mensual',
            'bimestral': 'Bimestral',
            'trimestral': 'Trimestral'
        };

        const clientTypeLabels = {
            'natural': 'Persona Natural',
            'empresa': 'Empresa',
            'natural-empresa': 'Persona con Empresa'
        };

        // Format products for email template
        const formattedProducts = quote.products.map((product, index) => `
            <div class="product-item" style="margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                <p style="margin: 5px 0;"><strong>Producto ${index + 1}:</strong> ${product.productName}</p>
                <p style="margin: 5px 0;"><strong>Presentación:</strong> ${product.presentationLabel || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Cantidad:</strong> ${product.quantity}</p>
                <p style="margin: 5px 0;"><strong>Frecuencia:</strong> ${frequencyLabels[product.frequency] || product.frequency}</p>
            </div>
        `).join('');

        // Format contact preferences
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

        const logoBuffer = await resolveLogoBuffer();
        const logoCid = 'qi-logo';
        const logoSrc = logoBuffer ? `cid:${logoCid}` : (process.env.COMPANY_LOGO_URL || 'https://quimicaindustrial.pe/logo.png');

        const { companyTo, clientTo } = getEmailRecipients(quote);

        const companyName = process.env.COMPANY_NAME || 'Química Industrial Perú';
        const companyAddress = process.env.COMPANY_ADDRESS || 'Lima, Perú';
        const companyPhone = process.env.COMPANY_PHONE || '+51 1 234 5678';
        const companyEmail = process.env.COMPANY_EMAIL || 'contacto@quimicaindustrial.pe';

        // Send email to company
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@quimicaindustrial.pe',
            to: companyTo,
            subject: `Nueva Cotización - ${clientName}`,
            html: companyTemplate({
                logo: logoSrc,
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
            }),
            attachments: [
                ...(logoBuffer ? [{
                    filename: 'qi-logo.png',
                    content: logoBuffer,
                    cid: logoCid
                }] : []),
                {
                    filename: `cotizacion-${quote._id}.pdf`,
                    content: pdfBuffer
                }
            ]
        });

        // Send confirmation email to client
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@quimicaindustrial.pe',
            to: clientTo,
            subject: 'Confirmación de Cotización - Química Industrial Perú',
            html: clientTemplate({
                logo: logoSrc,
                clientName: clientName,
                quoteId: quote._id,
                date: new Date(quote.createdAt).toLocaleDateString('es-PE'),
                products: formattedProducts,
                observations: observationsText,
                companyName,
                companyAddress,
                companyPhone,
                companyEmail
            }),
            attachments: [
                ...(logoBuffer ? [{
                    filename: 'qi-logo.png',
                    content: logoBuffer,
                    cid: logoCid
                }] : [])
            ]
        });

        return true;
    } catch (error) {
        console.error('Error sending quote emails:', error);
        throw error;
    }
};

module.exports = {
    sendQuoteEmail,
    sendContactEmail
};