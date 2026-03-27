const { google } = require('googleapis');

const googleAuth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/analytics'
    ],
});

const analyticsDataClient = google.analyticsdata('v1beta');

module.exports = { googleAuth, analyticsDataClient };
