/**
 * One-time script to obtain a Zoho OAuth2 refresh token.
 * Run: npm run auth
 *
 * Steps:
 * 1. Fill in ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in .env
 * 2. Run this script — it opens the Zoho authorization page in your browser
 * 3. Authorize the app → you get redirected to localhost:3000/oauth/callback
 * 4. Copy the refresh_token printed in the terminal into your .env file
 */

require('dotenv').config();
const http = require('http');
const { exec } = require('child_process');
const axios = require('axios');

const {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_DOMAIN = 'zoho.in'
} = process.env;

const REDIRECT_URI = 'http://localhost:3000/oauth/callback';
const SCOPE = 'ZohoCRM.modules.ALL,ZohoCRM.settings.modules.READ';

const authUrl =
  `https://accounts.${ZOHO_DOMAIN}/oauth/v2/auth` +
  `?scope=${encodeURIComponent(SCOPE)}` +
  `&client_id=${ZOHO_CLIENT_ID}` +
  `&response_type=code` +
  `&access_type=offline` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

console.log('\n🚀 Zoho OAuth2 Authorization Flow');
console.log('=====================================');
console.log('Opening browser to Zoho authorization page...');
console.log('\nIf browser does not open, visit this URL manually:');
console.log('\x1b[36m' + authUrl + '\x1b[0m\n');

// Open browser
const platform = process.platform;
const cmd =
  platform === 'win32' ? `start "" "${authUrl}"` :
  platform === 'darwin' ? `open "${authUrl}"` :
  `xdg-open "${authUrl}"`;
exec(cmd);

// Start a temporary HTTP server to capture the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');

  if (url.pathname !== '/oauth/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error('\n❌ Authorization failed:', error);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>Authorization Failed</h2><p>' + error + '</p>');
    server.close();
    return;
  }

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h2>No authorization code received</h2>');
    server.close();
    return;
  }

  console.log('✅ Authorization code received. Exchanging for tokens...');

  try {
    const response = await axios.post(
      `https://accounts.${ZOHO_DOMAIN}/oauth/v2/token`,
      null,
      {
        params: {
          code,
          client_id: ZOHO_CLIENT_ID,
          client_secret: ZOHO_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        }
      }
    );

    const { access_token, refresh_token } = response.data;

    console.log('\n🎉 SUCCESS! Tokens received:');
    console.log('=====================================');
    console.log('ACCESS TOKEN (expires in 1 hour):');
    console.log('\x1b[33m' + access_token + '\x1b[0m');
    console.log('\nREFRESH TOKEN (does not expire — save this!):');
    console.log('\x1b[32m' + refresh_token + '\x1b[0m');
    console.log('\n⚠️  Add this to your .env file:');
    console.log(`ZOHO_REFRESH_TOKEN=${refresh_token}`);
    console.log('=====================================\n');

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zoho Auth Success</title>
          <style>
            body { font-family: Arial; background: #0d1b2a; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .box { background: rgba(255,255,255,0.1); padding: 40px; border-radius: 16px; text-align: center; max-width: 600px; }
            h1 { color: #00b4d8; }
            .token { background: #1a2f45; padding: 12px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 12px; margin: 10px 0; color: #7fff7f; }
            p { color: #ccc; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>✅ Authorization Successful!</h1>
            <p>Your refresh token has been printed in the terminal.</p>
            <p>Add it to your <strong>.env</strong> file as:<br><code>ZOHO_REFRESH_TOKEN=...</code></p>
            <p style="color:#00b4d8">Then run <strong>npm start</strong> to launch the dashboard.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    const msg = err.response?.data
      ? JSON.stringify(err.response.data, null, 2)
      : err.message;
    console.error('\n❌ Token exchange failed:', msg);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h2>Token exchange failed</h2><pre>' + msg + '</pre>');
  }

  server.close(() => {
    console.log('Auth server closed. You can now run: npm start');
    process.exit(0);
  });
});

server.listen(3000, () => {
  console.log('Waiting for authorization callback on http://localhost:3000/oauth/callback ...');
});
