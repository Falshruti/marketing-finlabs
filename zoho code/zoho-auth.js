require('dotenv').config();
const axios = require('axios');

const {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN,
  ZOHO_DOMAIN = 'zoho.in'
} = process.env;

let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Returns a valid Zoho access token, refreshing it if expired.
 */
async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  if (!ZOHO_REFRESH_TOKEN || ZOHO_REFRESH_TOKEN === 'your_refresh_token_here') {
    throw new Error(
      'ZOHO_REFRESH_TOKEN is not set. Run "npm run auth" to generate one.'
    );
  }

  try {
    const response = await axios.post(
      `https://accounts.${ZOHO_DOMAIN}/oauth/v2/token`,
      null,
      {
        params: {
          refresh_token: ZOHO_REFRESH_TOKEN,
          client_id: ZOHO_CLIENT_ID,
          client_secret: ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token'
        }
      }
    );

    const { access_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error(
        `Failed to get access token. Response: ${JSON.stringify(response.data)}`
      );
    }

    cachedToken = access_token;
    tokenExpiresAt = now + expires_in * 1000;

    console.log('[Auth] Access token refreshed successfully.');
    return cachedToken;
  } catch (err) {
    const msg = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    throw new Error(`Token refresh failed: ${msg}`);
  }
}

/**
 * Returns Axios headers with a valid Bearer token.
 */
async function getAuthHeaders() {
  const token = await getAccessToken();
  return { Authorization: `Zoho-oauthtoken ${token}` };
}

module.exports = { getAccessToken, getAuthHeaders };
