// src/app/app.functions/docusignAuth.js
// Simplified DocuSign JWT Authentication

const crypto = require('crypto');
const axios = require('axios');

exports.main = async (context) => {
  console.log('🔐 Starting DocuSign authentication process');

  try {
    // Hardcoded credentials - no environment variables needed
    const integrationKey = "ad93e46e-cb95-46b1-876e-9ac7f8bbf56a";
    const userId = "6717103e-a0a8-4a14-983c-8b2134dc7b68";
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

    console.log('🔑 Using hardcoded DocuSign credentials');
    console.log('📋 Integration Key:', integrationKey);
    console.log('👤 User ID:', userId);
    console.log('🔐 Private Key: Available');

    // Test private key format first
    console.log('🔍 Testing private key format...');
    try {
      const testSign = crypto.createSign('RSA-SHA256');
      testSign.update('test-string');
      testSign.sign(privateKey, 'base64');
      console.log('✅ Private key format is valid');
    } catch (keyError) {
      console.log('❌ Private key format error:', keyError.message);
      
      // Try converting to PKCS#8
      console.log('🔧 Converting to PKCS#8 format...');
      try {
        const keyObject = crypto.createPrivateKey(privateKey);
        const pkcs8Key = keyObject.export({
          format: 'pem',
          type: 'pkcs8'
        });
        
        // Test PKCS#8 format
        const testSign2 = crypto.createSign('RSA-SHA256');
        testSign2.update('test-string');
        testSign2.sign(pkcs8Key, 'base64');
        
        console.log('✅ PKCS#8 conversion successful');
        privateKey = pkcs8Key; // Use converted key
      } catch (convertError) {
        console.log('❌ PKCS#8 conversion failed:', convertError.message);
        throw new Error('Unable to validate private key format');
      }
    }

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const jwtToken = generateJWT(integrationKey, userId, privateKey);
    console.log('✅ JWT token generated');
    console.log('🔍 JWT token length:', jwtToken.length);
    console.log('🔍 JWT token preview:', jwtToken.substring(0, 50) + '...');

    // Test connectivity first
    console.log('🌐 Testing DocuSign connectivity...');
    try {
      await axios.get('https://account.docusign.com', { timeout: 10000 });
      console.log('✅ DocuSign servers reachable');
    } catch (connectError) {
      console.log('⚠️ Connectivity test failed:', connectError.message);
    }

    // Test connectivity first
    console.log('🌐 Testing DocuSign connectivity...');
    try {
      await axios.get('https://account.docusign.com', { timeout: 10000 });
      console.log('✅ DocuSign servers reachable');
    } catch (connectError) {
      console.log('⚠️ Connectivity test failed:', connectError.code || connectError.message);
      console.log('🔄 Proceeding with authentication anyway...');
    }

    // Request access token
    console.log('🌐 Requesting access token...');
    try {
      const requestBody = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`;
      console.log('📤 Request URL: https://account.docusign.com/oauth/token');
      console.log('📤 Request body length:', requestBody.length);
      console.log('📤 Request body preview:', requestBody.substring(0, 100) + '...');
      
      const response = await axios.post(
        'https://account.docusign.com/oauth/token',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      const accessToken = response.data.access_token;
      console.log('✅ Access token obtained');

      // Get user account information
      console.log('👤 Getting account information...');
      const userInfoResponse = await axios.get('https://account.docusign.com/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      const userInfo = userInfoResponse.data;
      console.log('📊 Account info retrieved:', userInfo.accounts?.length || 0, 'accounts');

      if (!userInfo.accounts || userInfo.accounts.length === 0) {
        throw new Error('No DocuSign accounts found');
      }

      const defaultAccount = userInfo.accounts.find(acc => acc.is_default) || userInfo.accounts[0];
      let baseUrl = defaultAccount.base_uri;
      if (!baseUrl.endsWith('/restapi/v2.1')) {
        baseUrl = baseUrl.endsWith('/') ? baseUrl + 'restapi/v2.1' : baseUrl + '/restapi/v2.1';
      }

      console.log('🎉 Authentication successful!');

      return {
        status: "SUCCESS",
        message: "DocuSign authentication successful",
        data: {
          accessToken,
          account: {
            accountId: defaultAccount.account_id,
            accountName: defaultAccount.account_name,
            isDefault: defaultAccount.is_default || false
          },
          baseUrl,
          expiresIn: response.data.expires_in || 3600
        },
        timestamp: Date.now()
      };

    } catch (tokenError) {
      console.log(tokenError);
      console.error('❌ Token request failed with details:');
      console.error('Error message:', tokenError.message);
      console.error('Error code:', tokenError.code);
      console.error('Error errno:', tokenError.errno);
      console.error('Error syscall:', tokenError.syscall);
      
      if (tokenError.response) {
        console.log('📥 Response status:', tokenError.response.status);
        console.log('📥 Response statusText:', tokenError.response.statusText);
        console.log('📥 Response data:', JSON.stringify(tokenError.response.data, null, 2));
        
        if (tokenError.response.data?.error === 'consent_required') {
          const consentUrl = `https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=https://www.docusign.com`;
          
          return {
            status: "CONSENT_REQUIRED",
            message: "DocuSign JWT consent is required",
            data: { consentUrl },
            timestamp: Date.now()
          };
        }
      } else if (tokenError.request) {
        console.log('📤 Request was made but no response received');
        console.log('📤 This typically indicates a network/timeout issue');
      } else {
        console.log('⚙️ Error setting up the request:', tokenError.message);
      }
      
      throw tokenError; // Re-throw to be caught by outer catch
    }

    return {
      status: "SUCCESS",
      message: "DocuSign authentication successful",
      data: {
        accessToken,
        account: {
          accountId: defaultAccount.account_id,
          accountName: defaultAccount.account_name,
          isDefault: defaultAccount.is_default || false
        },
        baseUrl,
        expiresIn: response.data.expires_in || 3600
      },
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("❌ Main authentication error:", error.message);
    console.error("❌ Error type:", error.constructor.name);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error stack:", error.stack);
    
    if (error.response) {
      console.log('📥 HTTP Response received:');
      console.log('📥 Status:', error.response.status);
      console.log('📥 StatusText:', error.response.statusText);
      console.log('📥 Headers:', JSON.stringify(error.response.headers, null, 2));
      console.log('📥 Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data?.error === 'consent_required') {
        const consentUrl = `https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=https://www.docusign.com`;
        
        return {
          status: "CONSENT_REQUIRED",
          message: "DocuSign JWT consent is required",
          data: { consentUrl },
          timestamp: Date.now()
        };
      }
    } else if (error.request) {
      console.log('📤 Request details:');
      console.log('📤 No response received from server');
      console.log('📤 Possible network/timeout/firewall issue');
    } else {
      console.log('⚙️ Request setup error:', error.message);
    }
    
    return {
      status: "ERROR",
      message: `Authentication failed: ${error.message}`,
      errorCode: error.code,
      errorType: error.constructor.name,
      timestamp: Date.now()
    };
  }
};

/**
 * Generate JWT token
 */
function generateJWT(integrationKey, userId, privateKey) {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const payload = {
      iss: integrationKey,
      sub: userId,
      iat: now,
      exp: now + 3600,
      aud: 'account.docusign.com',
      scope: 'signature impersonation extended'
    };

    console.log('🔍 JWT Payload:', JSON.stringify(payload, null, 2));

    // URL-safe base64 encode
    const encodedHeader = Buffer.from(JSON.stringify(header))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const encodedPayload = Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const signatureBase = `${encodedHeader}.${encodedPayload}`;
    console.log('🔍 Signature base length:', signatureBase.length);

    // Create signature
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureBase);
    const signature = signer.sign(privateKey, 'base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('🔍 Signature length:', signature.length);

    const finalToken = `${signatureBase}.${signature}`;
    console.log('🔍 Final JWT length:', finalToken.length);
    
    return finalToken;
  } catch (jwtError) {
    console.error('❌ JWT generation error:', jwtError.message);
    throw jwtError;
  }
}