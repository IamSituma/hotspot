require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

// List of public paths that don't require verification
const publicPaths = [
    '/index.html',
    '/',
    '/verify.html',
    '/style.css',
    '/14.png',
    '/1420.jpg',
    '/powered-by.png',
    '/Primary-01.png'
];

// EgoSMS API Configuration
const EGOSMS_CONFIG = {
    username: process.env.EGOSMS_USERNAME || 'situmaambrose', // Live account credentials
    password: process.env.EGOSMS_PASSWORD || 'ba56181368839e1151a3d875898f6048ad7aa7933f7e2720', // Live account credentials
    sender: process.env.EGOSMS_SENDER || 'SprintUG',
    liveUrl: 'https://www.egosms.co/api/v1/plain/',
    sandboxUrl: 'http://sandbox.egosms.co/api/v1/plain/',
    useSandbox: process.env.EGOSMS_SANDBOX === 'true' // Default to live mode unless explicitly set to sandbox
};

const server = http.createServer((req, res) => {
    // Handle API routes
    if (req.url.startsWith('/api/')) {
        if (req.url === '/api/send-sms' && req.method === 'POST') {
            handleSendSMS(req, res);
            return;
        }
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // If this is not a public path and not verified, redirect to verify page
    const isPublicPath = publicPaths.includes(req.url);
    const cookies = parseCookies(req);
    const isVerified = cookies.isPhoneVerified === 'true';

    if (!isPublicPath && !isVerified) {
        res.writeHead(302, { 'Location': '/verify.html' });
        res.end();
        return;
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.jpg':
        case '.jpeg':
            contentType = 'image/jpeg';
            break;
        case '.png':
            contentType = 'image/png';
            break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server Error: '+error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Handle SMS sending API endpoint
function handleSendSMS(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const { phoneNumber, message } = JSON.parse(body);

            if (!phoneNumber || !message) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Phone number and message are required' }));
                return;
            }

            sendSMS(phoneNumber, message)
                .then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, result }));
                })
                .catch(error => {
                    console.error('SMS sending error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                });

        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
        }
    });
}

// Function to send SMS using EgoSMS API
function sendSMS(phoneNumber, message) {
    return new Promise((resolve, reject) => {
        // Format phone number with country code if not present
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

        // Prepare API parameters
        const params = {
            username: EGOSMS_CONFIG.username,
            password: EGOSMS_CONFIG.password,
            number: formattedNumber,
            message: message,
            sender: EGOSMS_CONFIG.sender,
            priority: '0' // Highest priority
        };

        // Build query string
        const queryString = querystring.stringify(params);
        const apiUrl = (EGOSMS_CONFIG.useSandbox ? EGOSMS_CONFIG.sandboxUrl : EGOSMS_CONFIG.liveUrl) + '?' + queryString;

        console.log('SMS API URL:', apiUrl); // For debugging

        // Make HTTP GET request to EgoSMS API
        const url = new URL(apiUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            timeout: 30000, // 30 seconds timeout
            headers: {
                'User-Agent': 'Node.js Hotspot Server'
            }
        };

        const req = https.request(options, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                const response = data.trim();
                console.log('SMS API Response:', response); // For debugging

                // Check if SMS was sent successfully
                if (response.toLowerCase() === 'ok') {
                    resolve({ status: 'sent', message: 'SMS sent successfully' });
                } else {
                    reject(new Error(`SMS API Error: ${response}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('SMS API Network Error:', error);
            reject(new Error(`Network error: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            console.error('SMS API Timeout');
            reject(new Error('Request timeout - SMS service may be unavailable'));
        });

        req.end();
    });
}

// Helper function to parse cookies from request
function parseCookies(req) {
    const cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.split('=').map(c => c.trim());
            cookies[name] = value;
        });
    }
    return cookies;
}

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
