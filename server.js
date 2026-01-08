require('dotenv').config();
const https = require('https');

// EgoSMS API Configuration
const EGOSMS_CONFIG = {
    username: process.env.EGOSMS_USERNAME || 'situmaambrose', // Live account credentials
    password: process.env.EGOSMS_PASSWORD || 'ba56181368839e1151a3d875898f6048ad7aa7933f7e2720', // Live account credentials
    sender: process.env.EGOSMS_SENDER || 'SprintUG',
    liveUrl: 'https://www.egosms.co/api/v1/json/',
    sandboxUrl: 'http://sandbox.egosms.co/api/v1/json/',
    useSandbox: process.env.EGOSMS_SANDBOX === 'true' // Default to live mode unless explicitly set to sandbox
};

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
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    });
                    res.end(JSON.stringify({ success: true, result }));
                })
                .catch(error => {
                    console.error('SMS sending error:', error);
                    res.writeHead(500, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                });

        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON payload' }));
        }
    });
}

// Function to send SMS using EgoSMS JSON API
function sendSMS(phoneNumber, message) {
    return new Promise((resolve, reject) => {
        // Format phone number with country code if not present
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

        // Prepare JSON payload for EgoSMS API
        const payload = {
            method: 'SendSms',
            userdata: {
                username: EGOSMS_CONFIG.username,
                password: EGOSMS_CONFIG.password
            },
            msgdata: [{
                number: formattedNumber,
                message: message,
                senderid: EGOSMS_CONFIG.sender,
                priority: '0' // Highest priority
            }]
        };

        const jsonPayload = JSON.stringify(payload);
        const apiUrl = EGOSMS_CONFIG.useSandbox ? EGOSMS_CONFIG.sandboxUrl : EGOSMS_CONFIG.liveUrl;

        console.log('SMS API URL:', apiUrl);
        console.log('SMS API Payload:', jsonPayload);

        // Make HTTP POST request to EgoSMS JSON API
        const url = new URL(apiUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            timeout: 30000, // 30 seconds timeout
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(jsonPayload),
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
                console.log('SMS API Response:', response);
                console.log('SMS API Status Code:', apiRes.statusCode);

                try {
                    const jsonResponse = JSON.parse(response);

                    // Check if SMS was sent successfully
                    if (jsonResponse.Status === 'OK') {
                        resolve({
                            status: 'sent',
                            message: 'SMS sent successfully',
                            cost: jsonResponse.Cost,
                            uniqueCode: jsonResponse.MsgFollowUpUniqueCode
                        });
                    } else {
                        // Handle JSON error responses
                        let errorMessage = jsonResponse.Message || 'Unknown SMS API error';

                        if (errorMessage.includes('That user does not exist or user not active')) {
                            errorMessage = 'EgoSMS account not activated. Please contact EgoSMS support.';
                        } else if (errorMessage.includes('Wrong Username or Password')) {
                            errorMessage = 'Invalid EgoSMS credentials. Please check your username and password.';
                        } else if (errorMessage.includes('Money Not Enough')) {
                            errorMessage = 'Insufficient funds in EgoSMS account. Please add credits.';
                        }

                        reject(new Error(errorMessage));
                    }
                } catch (parseError) {
                    console.error('Failed to parse SMS API JSON response:', parseError);
                    console.error('Raw response:', response);

                    // Fallback for non-JSON responses
                    if (response.includes('That user does not exist or user not active')) {
                        reject(new Error('EgoSMS account not activated. Please contact EgoSMS support.'));
                    } else if (response.includes('html') || response.includes('<')) {
                        reject(new Error('SMS service temporarily unavailable (received HTML error page)'));
                    } else {
                        reject(new Error(`SMS API Error: ${response}`));
                    }
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

        // Write the JSON payload
        req.write(jsonPayload);
        req.end();
    });
}

// Vercel serverless function export
module.exports = (req, res) => {

    // Handle API routes
    if (req.url.startsWith('/api/')) {
        // Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            res.end();
            return;
        }

        if (req.url === '/api/send-sms' && req.method === 'POST') {
            handleSendSMS(req, res);
            return;
        }
    }

    // For non-API routes, redirect to index.html (Vercel will serve static files)
    res.writeHead(302, { 'Location': '/index.html' });
    res.end();
};
