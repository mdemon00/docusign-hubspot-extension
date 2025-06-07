// src/app/app.functions/docusignAuth.js
// Fixed DocuSign JWT Authentication with Environment Support

const crypto = require('crypto');
const axios = require('axios');

exports.main = async (context) => {
  console.log('🔐 Starting DocuSign authentication process');

  try {
    // Correct credentials
    const integrationKey = "ad93e46e-5aa0-473b-8d9f-616db94d2614";
    const userId = "6717103e-13de-4e45-8ede-b63cb8cc52e1";
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

    // PRODUCTION ONLY CONFIGURATION
    const env = {
      authUrl: 'https://account.docusign.com/oauth/token',
      userInfoUrl: 'https://account.docusign.com/oauth/userinfo', 
      consentBaseUrl: 'https://account.docusign.com/oauth/auth',
      audience: 'account.docusign.com'
    };

    console.log('🌍 Using PRODUCTION environment');
    console.log(`🔗 Auth URL: ${env.authUrl}`);

    // Generate JWT token with correct audience
    console.log('🎫 Generating JWT token...');
    const jwtToken = generateJWT(integrationKey, userId, privateKey, env.audience);
    console.log('✅ JWT token generated');

    // Request access token
    console.log('🌐 Requesting access token...');
    try {
      const requestBody = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`;
      console.log('📤 Request body length:', requestBody.length);
      console.log('📤 Request body preview:', requestBody.substring(0, 200) + '...');
      
      console.log('📤 Making POST request to:', env.authUrl);
      console.log('📤 Request headers:', {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      });
      
      const response = await axios.post(env.authUrl, requestBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000,
        validateStatus: function (status) {
          console.log('📥 Response status received:', status);
          return status < 600; // Don't throw for any status < 600
        }
      });

      console.log('📥 Full response status:', response.status);
      console.log('📥 Full response statusText:', response.statusText);
      console.log('📥 Full response headers:', JSON.stringify(response.headers, null, 2));
      console.log('📥 Full response data:', JSON.stringify(response.data, null, 2));

      if (response.status !== 200) {
        console.error('❌ Non-200 response received');
        if (response.data?.error === 'consent_required') {
          const consentUrl = `${env.consentBaseUrl}?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=https://www.docusign.com`;
          console.log('🔗 Consent URL generated:', consentUrl);
          
          return {
            status: "CONSENT_REQUIRED", 
            message: "DocuSign JWT consent is required",
            data: { 
              consentUrl,
              environment: 'production',
              instructions: 'Please visit the consent URL to authorize the application in the production environment.',
              fullResponse: response.data
            },
            timestamp: Date.now()
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
        }
      }

      const accessToken = response.data.access_token;
      if (!accessToken) {
        console.error('❌ No access token in response');
        throw new Error('No access_token in response: ' + JSON.stringify(response.data));
      }
      
      console.log('✅ Access token obtained, length:', accessToken.length);
      console.log('✅ Access token preview:', accessToken.substring(0, 20) + '...');

      // Get user account information  
      console.log('👤 Getting account information...');
      console.log('📤 Making GET request to:', env.userInfoUrl);
      
      const userInfoResponse = await axios.get(env.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        timeout: 30000,
        validateStatus: function (status) {
          console.log('📥 UserInfo response status received:', status);
          return status < 600;
        }
      });

      console.log('📥 UserInfo response status:', userInfoResponse.status);
      console.log('📥 UserInfo response headers:', JSON.stringify(userInfoResponse.headers, null, 2));
      console.log('📥 UserInfo response data:', JSON.stringify(userInfoResponse.data, null, 2));

      if (userInfoResponse.status !== 200) {
        throw new Error(`UserInfo HTTP ${userInfoResponse.status}: ${JSON.stringify(userInfoResponse.data)}`);
      }

      const userInfo = userInfoResponse.data;
      console.log('📊 Account info retrieved:', userInfo.accounts?.length || 0, 'accounts');

      if (!userInfo.accounts || userInfo.accounts.length === 0) {
        console.error('❌ No accounts found in user info');
        throw new Error('No DocuSign accounts found: ' + JSON.stringify(userInfo));
      }

      console.log('📋 Available accounts:');
      userInfo.accounts.forEach((acc, idx) => {
        console.log(`   Account ${idx + 1}: ${acc.account_name} (${acc.account_id}) - Default: ${acc.is_default || false}`);
        console.log(`   Base URI: ${acc.base_uri}`);
      });

      const defaultAccount = userInfo.accounts.find(acc => acc.is_default) || userInfo.accounts[0];
      console.log('🎯 Selected account:', defaultAccount.account_name, '(' + defaultAccount.account_id + ')');
      
      let baseUrl = defaultAccount.base_uri;
      console.log('🔗 Original base URL:', baseUrl);
      
      // Ensure proper API endpoint format
      if (!baseUrl.endsWith('/restapi/v2.1')) {
        baseUrl = baseUrl.endsWith('/') ? baseUrl + 'restapi/v2.1' : baseUrl + '/restapi/v2.1';
      }
      console.log('🔗 Final base URL:', baseUrl);

      console.log('🎉 Authentication successful!');
      console.log(`🏢 Account: ${defaultAccount.account_name} (${defaultAccount.account_id})`);
      console.log(`🔗 Base URL: ${baseUrl}`);

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
          expiresIn: response.data.expires_in || 3600,
          environment: 'production'
        },
        timestamp: Date.now()
      };

    } catch (tokenError) {
      console.error('❌ Token request failed with full details:');
      console.error('❌ Error message:', tokenError.message);
      console.error('❌ Error code:', tokenError.code);
      console.error('❌ Error stack:', tokenError.stack);
      
      if (tokenError.response) {
        console.error('📥 Error response status:', tokenError.response.status);
        console.error('📥 Error response statusText:', tokenError.response.statusText);
        console.error('📥 Error response headers:', JSON.stringify(tokenError.response.headers, null, 2));
        console.error('📥 Error response data:', JSON.stringify(tokenError.response.data, null, 2));
        
        if (tokenError.response.data?.error === 'consent_required') {
          const consentUrl = `${env.consentBaseUrl}?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=https://www.docusign.com`;
          console.log('🔗 Consent URL generated:', consentUrl);
          
          return {
            status: "CONSENT_REQUIRED", 
            message: "DocuSign JWT consent is required",
            data: { 
              consentUrl,
              environment: 'production',
              instructions: 'Please visit the consent URL to authorize the application in the production environment.',
              fullErrorResponse: tokenError.response.data
            },
            timestamp: Date.now()
          };
        }
      } else if (tokenError.request) {
        console.error('📤 Request was made but no response received');
        console.error('📤 Request details:', tokenError.request);
      } else {
        console.error('⚙️ Error setting up the request:', tokenError.message);
      }
      
      throw tokenError;
    }

  } catch (error) {
    console.error("❌ Main authentication error - FULL DETAILS:");
    console.error("❌ Error message:", error.message);
    console.error("❌ Error type:", error.constructor.name);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error errno:", error.errno);
    console.error("❌ Error syscall:", error.syscall);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error toString:", error.toString());
    console.error("❌ Error JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    if (error.response) {
      console.error("📥 Error has response object:");
      console.error("📥 Response status:", error.response.status);
      console.error("📥 Response statusText:", error.response.statusText);
      console.error("📥 Response headers:", JSON.stringify(error.response.headers, null, 2));
      console.error("📥 Response data:", JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data?.error === 'consent_required') {
        const consentUrl = `https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=https://www.docusign.com`;
        console.log('🔗 Consent URL generated in main catch:', consentUrl);
        
        return {
          status: "CONSENT_REQUIRED",
          message: "DocuSign JWT consent is required",
          data: { 
            consentUrl,
            environment: 'production',
            instructions: 'Please visit the consent URL to authorize the application in the production environment.',
            fullErrorResponse: error.response.data
          },
          timestamp: Date.now()
        };
      }
    } else if (error.request) {
      console.error("📤 Error has request object but no response:");
      console.error("📤 Request details:", error.request);
    } else {
      console.error("⚙️ Error in request setup:", error.message);
    }
    
    return {
      status: "ERROR",
      message: `Authentication failed: ${error.message}`,
      errorDetails: {
        message: error.message,
        code: error.code,
        type: error.constructor.name,
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      },
      timestamp: Date.now()
    };
  }
};

/**
 * Generate JWT token with extensive debug logging
 */
function generateJWT(integrationKey, userId, privateKey, audience) {
  console.log('🔧 Starting JWT generation...');
  console.log('🔧 Integration Key:', integrationKey);
  console.log('🔧 User ID:', userId);
  console.log('🔧 Audience:', audience);
  console.log('🔧 Private Key Length:', privateKey.length);
  console.log('🔧 Private Key Preview:', privateKey.substring(0, 50) + '...');
  
  try {
    const now = Math.floor(Date.now() / 1000);
    console.log('🔧 Current timestamp:', now);
    
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    console.log('🔧 JWT Header:', JSON.stringify(header));

    const payload = {
      iss: integrationKey,
      sub: userId,
      iat: now,
      exp: now + 3600,
      aud: audience,
      scope: 'signature impersonation extended'
    };
    console.log('🔍 JWT Payload:', JSON.stringify(payload, null, 2));

    // Step 1: Encode header
    console.log('🔧 Step 1: Encoding header...');
    let encodedHeader;
    try {
      const headerString = JSON.stringify(header);
      console.log('🔧 Header string:', headerString);
      const headerBuffer = Buffer.from(headerString);
      console.log('🔧 Header buffer length:', headerBuffer.length);
      const headerBase64 = headerBuffer.toString('base64');
      console.log('🔧 Header base64:', headerBase64);
      encodedHeader = headerBase64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      console.log('🔧 Encoded header:', encodedHeader);
    } catch (headerError) {
      console.error('❌ Header encoding error:', headerError);
      console.error('❌ Header error stack:', headerError.stack);
      throw new Error(`Header encoding failed: ${headerError.message}`);
    }

    // Step 2: Encode payload
    console.log('🔧 Step 2: Encoding payload...');
    let encodedPayload;
    try {
      const payloadString = JSON.stringify(payload);
      console.log('🔧 Payload string:', payloadString);
      const payloadBuffer = Buffer.from(payloadString);
      console.log('🔧 Payload buffer length:', payloadBuffer.length);
      const payloadBase64 = payloadBuffer.toString('base64');
      console.log('🔧 Payload base64:', payloadBase64);
      encodedPayload = payloadBase64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      console.log('🔧 Encoded payload:', encodedPayload);
    } catch (payloadError) {
      console.error('❌ Payload encoding error:', payloadError);
      console.error('❌ Payload error stack:', payloadError.stack);
      throw new Error(`Payload encoding failed: ${payloadError.message}`);
    }

    // Step 3: Create signature base
    console.log('🔧 Step 3: Creating signature base...');
    const signatureBase = `${encodedHeader}.${encodedPayload}`;
    console.log('🔧 Signature base length:', signatureBase.length);
    console.log('🔧 Signature base preview:', signatureBase.substring(0, 100) + '...');

    // Step 4: Test private key
    console.log('🔧 Step 4: Testing private key format...');
    try {
      const testSigner = crypto.createSign('RSA-SHA256');
      testSigner.update('test-data');
      const testSignature = testSigner.sign(privateKey, 'base64');
      console.log('🔧 Private key test successful, signature length:', testSignature.length);
    } catch (keyTestError) {
      console.error('❌ Private key test failed:', keyTestError);
      console.error('❌ Key test error stack:', keyTestError.stack);
      console.error('❌ Key test error code:', keyTestError.code);
      
      // Try to convert the key
      console.log('🔧 Attempting key conversion...');
      try {
        const keyObject = crypto.createPrivateKey(privateKey);
        console.log('🔧 Key object created successfully');
        const convertedKey = keyObject.export({
          format: 'pem',
          type: 'pkcs8'
        });
        console.log('🔧 Key converted to PKCS8 format');
        privateKey = convertedKey; // Use converted key
      } catch (conversionError) {
        console.error('❌ Key conversion failed:', conversionError);
        console.error('❌ Conversion error stack:', conversionError.stack);
        throw new Error(`Private key is invalid and cannot be converted: ${conversionError.message}`);
      }
    }

    // Step 5: Create signature
    console.log('🔧 Step 5: Creating signature...');
    let signature;
    try {
      const signer = crypto.createSign('RSA-SHA256');
      console.log('🔧 Signer created');
      signer.update(signatureBase);
      console.log('🔧 Signature base updated');
      const rawSignature = signer.sign(privateKey, 'base64');
      console.log('🔧 Raw signature created, length:', rawSignature.length);
      console.log('🔧 Raw signature preview:', rawSignature.substring(0, 50) + '...');
      signature = rawSignature
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      console.log('🔧 URL-safe signature created, length:', signature.length);
    } catch (signatureError) {
      console.error('❌ Signature creation error:', signatureError);
      console.error('❌ Signature error stack:', signatureError.stack);
      console.error('❌ Signature error code:', signatureError.code);
      console.error('❌ Signature error type:', typeof signatureError);
      console.error('❌ Signature error details:', Object.keys(signatureError));
      throw new Error(`Signature creation failed: ${signatureError.message}`);
    }

    // Step 6: Assemble final token
    console.log('🔧 Step 6: Assembling final token...');
    const finalToken = `${signatureBase}.${signature}`;
    console.log('🔧 Final JWT token length:', finalToken.length);
    console.log('🔧 Final JWT token preview:', finalToken.substring(0, 100) + '...');
    
    // Validate token format
    const parts = finalToken.split('.');
    console.log('🔧 Token parts count:', parts.length);
    console.log('🔧 Header part length:', parts[0]?.length);
    console.log('🔧 Payload part length:', parts[1]?.length);
    console.log('🔧 Signature part length:', parts[2]?.length);
    
    if (parts.length !== 3) {
      throw new Error(`Invalid JWT format - expected 3 parts, got ${parts.length}`);
    }
    
    console.log('✅ JWT generation completed successfully');
    return finalToken;
    
  } catch (jwtError) {
    console.error('❌ JWT generation error:', jwtError);
    console.error('❌ JWT error message:', jwtError.message);
    console.error('❌ JWT error stack:', jwtError.stack);
    console.error('❌ JWT error code:', jwtError.code);
    console.error('❌ JWT error type:', typeof jwtError);
    console.error('❌ JWT error constructor:', jwtError.constructor.name);
    console.error('❌ JWT error details:', JSON.stringify(jwtError, Object.getOwnPropertyNames(jwtError), 2));
    throw jwtError;
  }
}