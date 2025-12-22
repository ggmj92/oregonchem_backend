const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

// Default site configuration
const defaultSiteConfig = {
    name: process.env.COMPANY_NAME || 'Química Industrial Perú',
    address: process.env.COMPANY_ADDRESS || 'Jr. Dante 236, Surquillo, Lima, Perú',
    phone: process.env.COMPANY_PHONE || '+51 933 634 055',
    email: process.env.COMPANY_EMAIL || 'contacto@quimicaindustrial.pe',
    logo: path.join(__dirname, '../../public/qiLogo.png')
};

const brand = {
    accent: '#0b6b2b',
    text: '#2c3e50',
    muted: '#7f8c8d'
};

const resolveLogoBuffer = async (siteConfig) => {
    const logoPath = process.env.COMPANY_LOGO_PATH;
    const logoUrl = process.env.COMPANY_LOGO_URL;

    try {
        if (logoPath) {
            const buf = await fs.readFile(logoPath);
            return buf;
        }
    } catch (error) {
        console.warn('Logo file not found:', error.message);
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
        console.warn('Logo URL not accessible:', error.message);
    }

    try {
        const logoExists = await fs.access(siteConfig.logo).then(() => true).catch(() => false);
        if (logoExists) {
            const buf = await fs.readFile(siteConfig.logo);
            return buf;
        }
    } catch (error) {
        console.warn('Fallback logo not found:', error.message);
    }

    return null;
};

const generatePDF = async (quote) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Use default site configuration
        const siteConfig = defaultSiteConfig;

        // Set default font
        doc.font('Helvetica');

        // === Header with logo and company info ===
        (async () => {
            const logoBuffer = await resolveLogoBuffer(siteConfig);
            if (logoBuffer) {
                doc.image(logoBuffer, 50, 45, { width: 180 });
            }

            // Company Info - aligned left below logo
            doc
                .fontSize(16)
                .fillColor(brand.text)
                .text(siteConfig.name, 50, 120);

            doc
                .fontSize(10)
                .fillColor(brand.muted)
                .text(siteConfig.address, 50, 140)
                .text(`Whatsapp: ${siteConfig.phone}`, 50, 155)
                .text(`Email: ${siteConfig.email}`, 50, 170);

            // === Quote Title - centered ===
            doc
                .moveDown(2)
                .fontSize(20)
                .fillColor(brand.accent)
                .text('COTIZACIÓN', { align: 'center' })
                .moveDown();

            // === Quote Details - aligned left with time ===
            doc
                .fontSize(12)
                .fillColor(brand.text)
                .text(`Número: ${quote._id}`, { align: 'left' })
                .text(`Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-PE')}`, { align: 'left' })
                .text(`Hora: ${new Date(quote.createdAt).toLocaleTimeString('es-PE')}`, { align: 'left' });

            // === Client Information - aligned left ===
            doc
                .moveDown()
                .fontSize(14)
                .fillColor(brand.accent)
                .text('INFORMACIÓN DEL CLIENTE', { align: 'left' })
                .moveDown();

            const clientTypeLabels = {
                'natural': 'Persona Natural',
                'empresa': 'Empresa',
                'natural-empresa': 'Persona con Empresa'
            };

            doc
                .fontSize(12)
                .fillColor(brand.text)
                .text(`Tipo de Cliente: ${clientTypeLabels[quote.clientType] || quote.clientType}`, { align: 'left' })
                .text(`Nombre: ${quote.firstName} ${quote.lastName}`, { align: 'left' })
                .text(`DNI: ${quote.dni}`, { align: 'left' })
                .text(`Email: ${quote.email}`, { align: 'left' })
                .text(`Teléfono: ${quote.phone}`, { align: 'left' });

            if (quote.companyName) doc.text(`Razón Social: ${quote.companyName}`, { align: 'left' });
            if (quote.ruc) doc.text(`RUC: ${quote.ruc}`, { align: 'left' });

            // Contact preferences
            const contactPrefs = [];
            if (quote.contactPreferences.email) contactPrefs.push('Email');
            if (quote.contactPreferences.whatsapp) contactPrefs.push('WhatsApp');
            if (quote.contactPreferences.phone) contactPrefs.push('Llamada');
            if (contactPrefs.length > 0) {
                doc.text(`Método de contacto preferido: ${contactPrefs.join(', ')}`, { align: 'left' });
            }

            // === Products Section ===
            doc
                .moveDown()
                .fontSize(14)
                .fillColor(brand.accent)
                .text('PRODUCTOS SOLICITADOS', { align: 'left' })
                .moveDown();

            // Table header start position
            const startY = doc.y;

            // Table headers
            doc
                .fontSize(12)
                .fillColor(brand.text)
                .text('Producto', 50, startY)
                .text('Presentación', 200, startY)
                .text('Cantidad', 350, startY)
                .text('Frecuencia', 450, startY);

            // Table rows
            const frequencyLabels = {
                'unica': 'Única compra',
                'quincenal': 'Quincenal',
                'mensual': 'Mensual',
                'bimestral': 'Bimestral',
                'trimestral': 'Trimestral'
            };

            let y = startY + 20;
            quote.products.forEach(product => {
                doc
                    .fontSize(10)
                    .text(product.productName || 'N/A', 50, y, { width: 140 })
                    .text(product.presentationLabel || 'N/A', 200, y, { width: 140 })
                    .text(product.quantity.toString(), 350, y)
                    .text(frequencyLabels[product.frequency] || product.frequency, 450, y);
                y += 25;
            });

            // Observations if any
            const observationsText = String(quote.observations || '').trim();
            if (observationsText) {
                const bottomLimit = doc.page.height - doc.page.margins.bottom - 120;
                if (y > bottomLimit) {
                    doc.addPage();
                    y = doc.y;
                }

                doc.x = 50;
                doc.y = Math.max(doc.y, y + 10);

                doc
                    .moveDown(1)
                    .fontSize(14)
                    .fillColor(brand.accent)
                    .text('OBSERVACIONES', 50)
                    .moveDown(0.5)
                    .fontSize(10)
                    .fillColor(brand.text)
                    .text(observationsText, 50, doc.y, {
                        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                        align: 'left'
                    });
            }

            // Finish writing the document
            doc.end();
        })();
    });
};

module.exports = generatePDF;
