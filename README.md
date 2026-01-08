# Hotspot Page - SprintUG WiFi Captive Portal

A captive portal page for SprintUG WiFi access with phone verification via SMS.

## Features

- Phone number validation for Ugandan mobile networks
- SMS OTP verification using EgoSMS API
- Responsive design with modern UI
- Cookie-based session management
- Modal dialogs for Terms of Service and Privacy Policy

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure SMS API credentials:
   Create a `.env` file in the root directory with your EgoSMS credentials:

   ```env
   # EgoSMS API Configuration
   # Your live account credentials
   EGOSMS_USERNAME=situmaambrose
   EGOSMS_PASSWORD=ba56181368839e1151a3d875898f6048ad7aa7933f7e2720
   EGOSMS_SENDER=SprintUG

   # Set to 'true' for sandbox testing (defaults to live mode)
   EGOSMS_SANDBOX=false
   ```

3. Start the server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:8080`

## SMS API Configuration

The application uses the EgoSMS JSON API for sending SMS messages. By default, it runs in **live mode** for production use.

- **Live Mode** (Default): Uses `https://www.egosms.co/api/v1/json/` for real SMS sending
- **Sandbox Mode**: Set `EGOSMS_SANDBOX=true` for testing with sandbox environment
- **Fallback**: If SMS API fails, the app automatically falls back to test mode showing OTP codes directly

## Deployment Ready ✅

This application is now configured for **Vercel serverless deployment**:

- ✅ **Serverless Functions**: Compatible with Vercel's Node.js runtime
- ✅ **Environment Variables**: Properly configured for SMS API credentials
- ✅ **CORS Support**: Handles cross-origin requests for production
- ✅ **Error Handling**: Robust error handling for production environments
- ✅ **Static File Serving**: Serves HTML, CSS, JS, and images

⚠️ **Localhost Limitations**: SMS APIs often don't work from localhost due to security restrictions. For testing real SMS sending, consider:

1. **Using ngrok** to expose your localhost server:
   ```bash
   npm install -g ngrok
   ngrok http 8080
   ```

2. **Deploy to a server** with a public IP

3. **Test Mode**: The app falls back to test mode when SMS API fails, showing OTP codes directly for development

### Getting EgoSMS Credentials

**For Testing (Sandbox):**
1. Visit [http://sandbox.egosms.co](http://sandbox.egosms.co)
2. Create a sandbox account (default credentials may not work)
3. Use your sandbox username and password
4. Note: Default credentials `Egosmstest`/`egotest` may be inactive

**For Production (Live):**
1. Visit [https://www.egosms.co](https://www.egosms.co)
2. **Create an account and verify your email**
3. **⚠️ IMPORTANT: Contact EgoSMS support to activate your account**
4. **Add funds/credits to your account** (SMS sending requires balance)
5. Get your API username and password from the dashboard
6. Set the sender ID (maximum 11 characters)

**API Method:**
This application uses the **JSON API** method for better reliability and structured responses. The JSON API provides clearer success/failure responses compared to the HTTP method.

**Account Activation Required:**
- **New accounts need manual activation** by EgoSMS support
- **Credits must be added** before SMS sending works
- **Contact**: support@egosms.co or visit their website

**Troubleshooting:**
- If you get "That user does not exist or user not active", check:
  - ✅ Account verification status
  - ✅ Account balance/credits
  - ✅ Correct username and password
  - ✅ **Contact EgoSMS support for account activation**

### API Documentation

For more information about the EgoSMS API, visit:
[https://developers.pahappa.com/sending-sms-http/](https://developers.pahappa.com/sending-sms-http/)

## Supported Phone Number Formats

The application validates and accepts Ugandan mobile numbers for these networks:
- MTN Uganda: 077, 078
- Airtel Uganda: 075, 070
- Uganda Telecom: 071
- Africell Uganda: 072

## File Structure

```
├── index.html          # Main login page
├── verify.html         # OTP verification page
├── style.css           # Stylesheets
├── server.js           # Node.js server with SMS API
├── package.json        # Dependencies
└── assets/            # Images and static files
```

## API Endpoints

- `GET /*` - Serve static files
- `POST /api/send-sms` - Send SMS with OTP

### SMS API Request Format

```json
{
  "phoneNumber": "+256788200915",
  "message": "Your verification code is: 123456"
}
```

### SMS API Response Format

```json
{
  "success": true,
  "result": {
    "status": "sent",
    "message": "SMS sent successfully"
  }
}
```