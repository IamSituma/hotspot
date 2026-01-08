const http = require('http');
const fs = require('fs');
const path = require('path');

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

const server = http.createServer((req, res) => {
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
