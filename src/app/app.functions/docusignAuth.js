// src/app/app.functions/docusignAuth.js
// DocuSign JWT Authentication - Extracted from workflow code

const crypto = require('crypto');
const axios = require('axios');

exports.main = async (context) => {
  const logs = [];
  logs.push('Starting DocuSign authentication process');

  try {
    // Get credentials from environment
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
    const userId = process.env.DOCUSIGN_USER_ID;
    const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAyUnk5O6WeIrfSNohbOyc/2lhMC6bfOYNzgf5Y4WG/KML/uHo
9oKah+WR5Yaqggb/Fz4PQ4QVHaKb7a7PBsIINyXKA2fAwxwClm5U1dR8TPuo/8Ku
GfMy0y68zsJeytqhdp8SfBZvL7jDNnKZdIPdSmUvNAndxzearhUMtmg3KxjBYGDk
LBgzp+utC8OQJzFaxjNg6ryxylETrh+HQGYKxKIXxo5UvoGksb2EKxFJa15TGrL9
Om5BgdUWm3D5yX4El14vDriAfrktk7DHp7W/d3WRteuzqDtVaqS0WWfdgwgNEl0d
85bi0IMi/FI8GOS2x1eq23x+2UoSwg7hG3pPrQIDAQABAoIBABPKV55olNPCN6TW
iX3Hn8H+7ubJVlFH3yiYIR13VefF8hp7xKdj/OSKnjcWb/I71N3IpMCLHnZc8/7A
9qrf7eXaKcv+6fVk7h4zN9UUQKpi/eEzl2GGx0L7L+YWNzKznzdl+W/I1uK2xD64
srzBcELtwt/Xbn41Sdh+ylKu2Wm7pzTY0j40kCAFyzgTs/KPCxE7UdCoSngP+Y7W
2NRb77ZhsYrGDEd5dyS0qTu7D+YSId9rSdbxoSYCBf/uK56JOI8iAgERczewgoS5
42M3PE8ONTpzrQCsFn0HS9//KANT2B3IMhHF7s4CHOt39hVPiQ88Crc5SWBNtpOU
XZFo7RMCgYEA6LZmQT8LruWBhpiKDl6Duu68U3e2nir0zd2+2PdosHKRE0zw8yJd
Nk1LdPHVeKcu9xEc8PRA8pDjVMzqZiQXvzWsmIBrmC+RcJZERIuJJfCpwaH20KjI
NuFpiJsbDRhil5u0QFxCpi6ejVWk5vTZXgE/PUH84haKBQ+nXC1wrWcCgYEA3W57
eiRhbaIY+Oei8wYUzE71GA7hUkhQd9dkzlbJBo6jdxPSsmFK4ph/405wDiTTr1RK
usJGVaZsis1tJcjYT+VgQWREl7EKcvGboJr8w4ydrM+vONco7+NyUeRwh+4PEDTp
/ShnJSyX7bB+v0TB2fwasdhZ55aqkHnuN8NoWcsCgYEAh1vRDpKFUS3dsVR4uPLw
3IKQuFwhtM53pmcc40bFdhytlfRjEokifrtm8JbZ/FwCTWN+2gi43l64XFL05ISJ
64Zk5i+MZfEFP9+nxdcD5zWdCCwVTDlge8uRfwv5KBzO/DBtICKKAe+L+dmfGVfC
N5OyHQeM+FTz4w2/4zXrHHECgYAyZMl/M7ZkoAZ05yqjilfDY5jN/9zxv/loPMH5
X7DiaCX1nLJP3GqRhUldruU7os/2UAWt2TbumTCMqlHTzpDEJhyw5SPjLeyF2kyj
0YIC8waTZLSpB/aOGcJTttyRYvFUq+Ywsjg/MpXlB0zhNMG1XXWp0eYsGZL5zHYV
hMhD3wKBgEN+Xg4eKUfHjkwFjzjbjpM0oHR7/CKwLsiy9c9+XY/4Q6vh1xRNar9d
sY2QDyitfI5gTtKiwlQI6b8WdZuz3NcAJqXX8GSGZAOxu3Y3ArzPuXHBJUlxyfLm
+i+toYBS9Zb1buVoDvFw6LVUy+7AvCL1QSBqNShkuvvKXZE4GsbE
-----END RSA PRIVATE KEY-----`;

    // Validate essential credentials
    if (!integrationKey || !userId) {
      throw new Error('Missing required DocuSign credentials. Please configure DOCUSIGN_INTEGRATION_KEY and DOCUSIGN_USER_ID');
    }

    logs.push(`DocuSign Integration Key: ${integrationKey ? 'Provided' : 'Missing'}`);
    logs.push(`DocuSign User ID: ${userId ? 'Provided' : 'Missing'}`);

    // Generate JWT token
    const jwtToken = generateJWT(integrationKey, userId, privateKey);
    logs.push('JWT token generated successfully');

    // Request access token
    try {
      const response = await axios.post(
        'https://account.docusign.com/oauth/token',
        `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = response.data.access_token;
      logs.push('Access token obtained successfully');

      // Get user account information
      const userInfoResponse = await axios.get('https://account.docusign.com/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const userInfo = userInfoResponse.data;
      logs.push(`User info retrieved: ${userInfo.accounts?.length || 0} accounts found`);

      // Process account information
      let accountData = null;
      let baseUrl = null;

      if (userInfo.accounts && userInfo.accounts.length > 0) {
        // Find default account or use first available
        const defaultAccount = userInfo.accounts.find(acc => acc.is_default) || userInfo.accounts[0];
        
        accountData = {
          accountId: defaultAccount.account_id,
          accountName: defaultAccount.account_name,
          isDefault: defaultAccount.is_default || false
        };

        // Build base URL for API calls
        baseUrl = defaultAccount.base_uri;
        if (!baseUrl.endsWith('/restapi/v2.1')) {
          baseUrl = baseUrl.endsWith('/') 
            ? baseUrl + 'restapi/v2.1' 
            : baseUrl + '/restapi/v2.1';
        }

        logs.push(`Using account: ${accountData.accountName} (${accountData.accountId})`);
        logs.push(`API base URL: ${baseUrl}`);
      } else {
        throw new Error('No DocuSign accounts found for this user');
      }

      return {
        status: "SUCCESS",
        message: "DocuSign authentication successful",
        data: {
          accessToken,
          account: accountData,
          baseUrl,
          expiresIn: response.data.expires_in || 3600,
          tokenType: response.data.token_type || 'Bearer'
        },
        logs: logs.join('\n'),
        timestamp: Date.now()
      };

    } catch (tokenError) {
      if (tokenError.response?.data?.error === 'consent_required') {
        const consentUrl = `https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=https://www.docusign.com`;
        
        logs.push('DocuSign JWT consent is required');
        return {
          status: "CONSENT_REQUIRED",
          message: "DocuSign JWT consent is required",
          data: {
            consentUrl,
            instructions: "Please visit the consent URL to authorize the application"
          },
          logs: logs.join('\n'),
          timestamp: Date.now()
        };
      } else {
        throw new Error(`DocuSign authentication failed: ${tokenError.response?.data?.error_description || tokenError.message}`);
      }
    }

  } catch (error) {
    console.error("❌ Error in DocuSign authentication:", error);
    logs.push(`ERROR: ${error.message}`);
    
    return {
      status: "ERROR",
      message: `Authentication failed: ${error.message}`,
      errorDetails: error.toString(),
      logs: logs.join('\n'),
      timestamp: Date.now()
    };
  }
};

/**
 * Generate a JWT token for DocuSign authentication
 * @param {string} integrationKey - DocuSign integration key
 * @param {string} userId - DocuSign user ID
 * @param {string} privateKey - RSA private key
 * @returns {string} - JWT token
 */
function generateJWT(integrationKey, userId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: integrationKey,
    sub: userId,
    iat: now,
    exp: now + expiresIn,
    aud: 'account.docusign.com',
    scope: 'signature impersonation extended'
  };

  // Encode header and payload
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Create signature
  const signatureBase = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureBase);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signatureBase}.${signature}`;
}