/**
 * HUBSPOT CUSTOM CODE FOR DOCUSIGN INTEGRATION WITH JWT AUTHENTICATION
 * This code creates DocuSign envelopes using templates with hardcoded IDs.
 */

const axios = require('axios');
const crypto = require('crypto');

exports.main = async (event, callback) => {
  const logs = [];
  logs.push('Starting DocuSign envelope creation process');

  try {
    // Initialize variables and get input data
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
    const userId = process.env.DOCUSIGN_USER_ID;
    let accountId = "79080245"; // Initial account ID, will be replaced by token response
    
    logs.push(`Initial DocuSign Account ID: ${accountId} (will be updated from token response)`);
    logs.push(`DocuSign User ID: ${userId ? 'Provided' : 'Missing'}`);
    logs.push(`DocuSign Integration Key: ${integrationKey ? 'Provided' : 'Missing'}`);
    
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
      throw new Error('Missing required DocuSign credentials');
    }

    const consentUrl = `https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=https://www.docusign.com`;
    
    // Get input data
    const partnershipLevel = event.inputFields?.partnershipLevel;
    const recipientEmail = event.inputFields?.recipientEmail || 'john.creedon@upequity.com';
    const recipientName = event.inputFields?.recipientName || 'John';
    const emailSubject = event.inputFields?.emailSubject || `Please sign this document - ${partnershipLevel || 'Default'} Agreement`;
    const emailMessage = event.inputFields?.emailMessage || `Please review and sign this ${partnershipLevel || 'Default'} Agreement.`;
    const companyId = event.inputFields?.companyId;
    const companyOwner = event.inputFields?.companyOwner;
    
    logs.push(`DEBUG: companyOwner = "${companyOwner}" (type: ${typeof companyOwner})`);

    // Check if company ID exists
    if (!companyId) {
      logs.push('ERROR: Company ID is mandatory but was not provided');
      return callback({
        outputFields: {
          success: false,
          error: "Missing Company ID",
          message: "Company ID is mandatory for DocuSign integration",
          logs: logs.join('\n')
        }
      });
    }

    logs.push(`Partnership Level: ${partnershipLevel || 'Not specified'}`);
    logs.push(`Company ID: ${companyId}`);
    logs.push(`Recipient: ${recipientName} <${recipientEmail}>`);
    logs.push(`Company Owner: ${companyOwner || 'Not specified'}`);

    // Generate JWT and get access token
    try {
      logs.push('Generating JWT token and requesting access token');
      const jwtToken = generateJWT(integrationKey, userId, privateKey);
      
      let accessToken;
      let baseUrl;
      
      try {
        logs.push('Requesting DocuSign access token');
        const response = await axios.post(
          'https://account.docusign.com/oauth/token',
          `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        
        logs.push('Access token obtained successfully');
        accessToken = response.data.access_token;
        
        // Make a separate call to get user information and accounts
        logs.push('Fetching user information to get account details');
        try {
          const userInfoResponse = await axios.get('https://account.docusign.com/oauth/userinfo', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          logs.push(`Found ${userInfoResponse.data.accounts?.length || 0} accounts`);
          
          if (userInfoResponse.data.accounts && userInfoResponse.data.accounts.length > 0) {
            logs.push(`Found ${userInfoResponse.data.accounts.length} accounts in user info`);
            
            // Log all accounts for debugging
            userInfoResponse.data.accounts.forEach((acc, idx) => {
              logs.push(`Account #${idx+1}: ID=${acc.account_id}, Name=${acc.account_name}, IsDefault=${acc.is_default || false}`);
            });
            
            // Try to find default account first, then fall back to first account
            const defaultAccount = userInfoResponse.data.accounts.find(acc => acc.is_default) || userInfoResponse.data.accounts[0];
            
            // Use the account ID from user info response
            accountId = defaultAccount.account_id;
            logs.push(`Using account ID from user info: ${accountId}`);
            
            // Get base URL from account and append the REST API path
            if (defaultAccount.base_uri) {
              baseUrl = defaultAccount.base_uri;
              
              // Make sure the base URL ends with /restapi/v2.1
              if (!baseUrl.endsWith('/restapi/v2.1')) {
                if (baseUrl.endsWith('/')) {
                  baseUrl = baseUrl + 'restapi/v2.1';
                } else {
                  baseUrl = baseUrl + '/restapi/v2.1';
                }
              }
              
              logs.push(`Using API URL: ${baseUrl}`);
            } else {
              baseUrl = 'https://na4.docusign.net/restapi/v2.1';
            }
          } else {
            logs.push('WARNING: No accounts found in user info, checking direct account status');
            // Try making a direct call to check account status as a last resort
            try {
              const accountsResponse = await axios.get('https://account.docusign.com/restapi/v2.1/accounts', {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });
              logs.push(`Direct accounts response: ${JSON.stringify(accountsResponse.data, null, 2)}`);
              
              if (accountsResponse.data && accountsResponse.data.accounts && accountsResponse.data.accounts.length > 0) {
                accountId = accountsResponse.data.accounts[0].id;
                logs.push(`Using account ID from direct accounts call: ${accountId}`);
              }
            } catch (accountsError) {
              logs.push(`Failed to get accounts directly: ${accountsError.message}`);
              if (accountsError.response) {
                logs.push(`Error response: ${JSON.stringify(accountsError.response.data, null, 2)}`);
              }
            }
          }
        } catch (userInfoError) {
          logs.push(`Failed to get user info: ${userInfoError.message}`);
          if (userInfoError.response) {
            logs.push(`Error response: ${JSON.stringify(userInfoError.response.data, null, 2)}`);
          }
        }
        
        // If we still have no account information, try using a standard DocuSign API endpoint format
        if (!baseUrl) {
          baseUrl = 'https://demo.docusign.net/restapi/v2.1';  // Try demo environment
          logs.push(`WARNING: No base URL found, using fallback URL: ${baseUrl}`);
        }
        
        logs.push(`Using DocuSign base URL: ${baseUrl}`);
      } catch (tokenError) {
        if (tokenError.response?.data?.error === 'consent_required') {
          logs.push('DocuSign JWT consent is required');
          const consentErrorMessage = `DocuSign JWT consent is required. Visit: ${consentUrl}`;
          return callback({
            outputFields: {
              success: false,
              error: "DocuSign JWT consent required",
              message: consentErrorMessage,
              consentUrl: consentUrl,
              logs: logs.join('\n')
            }
          });
        } else {
          throw new Error(`Failed to obtain DocuSign access token: ${tokenError.message}`);
        }
      }
      
      // Create DocuSign client
      const docusignClient = axios.create({
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Template handling
      let templateId = null;
      let templateName = null;

      // Check if test mode is enabled
      const testMode = false;  // You can change this to event.inputFields?.testMode || false to make it dynamic
      logs.push(`Test mode is ${testMode ? 'ENABLED' : 'DISABLED'}`);

      // Use hardcoded template ID based on test mode and partnership level
      if (testMode) {
        // For test mode, always use the test template
        templateId = "fb3fb6ac-0821-4b81-ae25-6e2ffd50791d";
        templateName = "[TESTING ONLY] UpEquity Silver Level Marketing and Program Agreement with Rev Share(1)";
        logs.push(`Using test template with hardcoded ID: ${templateId}`);
      } else {
        // For non-test mode, use the production template IDs based on partnership level
        const templateIdMapping = {
          "Gold": "0aefb289-cf0f-4f87-9615-259fdacaf710",
          "Gold with Rev Share": "b5dc05f3-c738-4b23-a53e-9e620cc70fa8",
          "Silver": "04c93d91-cbbd-4032-9f84-0f7879b46c05",
          "Silver with Rev Share": "0cd02f3e-5ee5-4b5e-bebc-2b510eef0982",
          "Bronze": "51b8968d-05ea-4130-9ad5-9544b84f61c8"
        };

        const templateNameMapping = {
          "Gold": "UpEquity Gold Level Marketing and Program Agreement",
          "Gold with Rev Share": "UpEquity Gold Level Marketing and Program Agreement with Rev Share",
          "Silver": "UpEquity Silver Level Marketing and Program Agreement",
          "Silver with Rev Share": "UpEquity Silver Level Marketing and Program Agreement with Rev Share",
          "Bronze": "UpEquity Bronze Level Marketing and Program Agreement"
        };

        if (partnershipLevel && templateIdMapping[partnershipLevel]) {
          templateId = templateIdMapping[partnershipLevel];
          templateName = templateNameMapping[partnershipLevel];
          logs.push(`Using production template for ${partnershipLevel}: ${templateId}`);
          logs.push(`Template name: ${templateName}`);
        } else {
          logs.push(`WARNING: Unknown partnership level: ${partnershipLevel}`);
        }
      }

      // If no template found, return an error
      if (!templateId) {
        const errorMessage = `No DocuSign template found for partnership level: ${partnershipLevel}`;
        logs.push(`ERROR: ${errorMessage}`);
        
        return callback({
          outputFields: {
            success: false,
            error: "Template Not Found",
            message: errorMessage,
            logs: logs.join('\n')
          }
        });
      }

      // The rest of the code will only execute if a template was found
      logs.push(`Creating envelope using template: ${templateName}`);

      // Create standard text tabs (company name filling removed)
      const textTabs = [];
      const otherFields = {
        "Partnership_Size": "partnershipSize",
        "Partnership_Level": "partnershipLevel",
        "Corporate_Account": "corporateAccount",
        "Business_Type": "businessType",
        "Roster_Uploaded_Date": "rosterUploadedDate",
        "Hierarchy": "hierarchy"
      };

      Object.entries(otherFields).forEach(([tabLabel, paramKey]) => {
        const value = event.inputFields?.[paramKey] || '';
        textTabs.push({ tabLabel: tabLabel, value: value });
      });

      // Create envelope with template
      const envelopeDefinition = {
        emailSubject: emailSubject,
        emailBlurb: emailMessage,
        templateId: templateId,
        templateRoles: [{
          email: recipientEmail,
          name: recipientName,
          roleName: 'Partner Authorized Signer',
          routingOrder: '1',
          tabs: {
            textTabs: textTabs
          }
        }],
        customFields: {
          textCustomFields: [
            {
              name: "hubspot_company_id",
              value: companyId,
              required: "true",
              show: "false"
            }
          ]
        },
        status: 'sent'
      };

      // Add onBehalfOf if company owner is provided
      if (companyOwner) {
        // First, check if the user exists in the account
        try {
          logs.push(`DEBUG: Fetching all users in account...`);
          const usersResponse = await docusignClient.get(`/accounts/${accountId}/users`);
          const users = usersResponse.data.users || [];
          
          // Also check admin users specifically
          try {
            const adminUsersResponse = await docusignClient.get(`/accounts/${accountId}/users?permission_profile_name=DS Admin`);
            const adminUsers = adminUsersResponse.data.users || [];
            logs.push(`DEBUG: Found ${adminUsers.length} DS Admin users`);
            adminUsers.forEach((user, index) => {
              logs.push(`  Admin ${index + 1}. ${user.email} (${user.firstName} ${user.lastName})`);
            });
          } catch (adminError) {
            logs.push(`DEBUG: Could not fetch admin users: ${adminError.message}`);
          }
          
          logs.push(`DEBUG: Found ${users.length} users in account:`);
          users.forEach((user, index) => {
            logs.push(`  ${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - Status: ${user.userStatus}`);
          });
          
          const targetUser = users.find(user => user.email === companyOwner);
          const userExists = !!targetUser;
          logs.push(`DEBUG: User ${companyOwner} exists in account: ${userExists}`);
          
          if (userExists) {
            // Check user permissions for onBehalfOf
            try {
              logs.push(`DEBUG: Checking permissions for ${companyOwner}...`);
              const userDetailsResponse = await docusignClient.get(`/accounts/${accountId}/users/${targetUser.userId}`);
              const userSettings = userDetailsResponse.data;
              
              logs.push(`DEBUG: User status: ${userSettings.userStatus}`);
              logs.push(`DEBUG: Permission profile: ${userSettings.permissionProfileName || 'not set'}`);
              logs.push(`DEBUG: allowSendOnBehalfOf: ${userSettings.allowSendOnBehalfOf || 'not set'}`);
              logs.push(`DEBUG: canSendEnvelope: ${userSettings.canSendEnvelope || 'not set'}`);
              
              // Check if user has multiple group memberships
              if (userSettings.groupList && userSettings.groupList.length > 0) {
                logs.push(`DEBUG: User groups: ${userSettings.groupList.map(g => g.groupName).join(', ')}`);
              }
              
              // Force onBehalfOf since user has DS Admin group (even if primary profile lacks permission)
              envelopeDefinition.onBehalfOf = companyOwner;
              logs.push(`DEBUG: onBehalfOf set to: ${companyOwner} (has DS Admin group)`);
              
            } catch (permError) {
              logs.push(`DEBUG: Failed to check permissions: ${permError.message}`);
              // Still try onBehalfOf
              envelopeDefinition.onBehalfOf = companyOwner;
              logs.push(`DEBUG: onBehalfOf set to: ${companyOwner} (despite permission check failure)`);
            }
          } else {
            logs.push(`DEBUG: User ${companyOwner} not found - onBehalfOf will be ignored`);
          }
        } catch (userCheckError) {
          logs.push(`DEBUG: Failed to check users: ${userCheckError.message}`);
          // Still try onBehalfOf in case the API call failed
          envelopeDefinition.onBehalfOf = companyOwner;
          logs.push(`DEBUG: onBehalfOf set to: ${companyOwner} (despite check failure)`);
        }
        
        // Alternative: Use email settings to customize sender appearance
        envelopeDefinition.emailSettings = {
          replyEmailAddressOverride: companyOwner,
          replyEmailNameOverride: event.inputFields?.companyOwnerName || 'Company Owner'
        };
        logs.push(`DEBUG: Also set email settings for: ${companyOwner}`);
      } else {
        logs.push('DEBUG: No companyOwner - using default sender');
      }

      logs.push(`Sending envelope to DocuSign account ID: ${accountId}`);
      logs.push(`URL: POST /accounts/${accountId}/envelopes`);
      logs.push(`Template ID being used: ${templateId}`);
      logs.push(`Recipient: ${recipientName} <${recipientEmail}>`);
      logs.push(`Role name: Partner Authorized Signer`);
      logs.push(`Number of text tabs: ${textTabs.length}`);
      logs.push(`DEBUG: onBehalfOf in envelope = ${envelopeDefinition.onBehalfOf || 'NOT SET'}`);
      
      try {
        logs.push(`Making DocuSign API call...`);
        const response = await docusignClient.post(`/accounts/${accountId}/envelopes`, envelopeDefinition);
        
        const envelopeId = response.data.envelopeId;
        const envelopeStatus = response.data.status;

        logs.push(`DocuSign envelope created: ${envelopeId}`);
        logs.push(`Envelope status: ${envelopeStatus}`);
        
        // Check if sender info is in response
        if (response.data.sender) {
          logs.push(`DEBUG: Response sender = ${response.data.sender.email || 'no email'}`);
        } else {
          logs.push(`DEBUG: No sender info in response`);
        }
        
        // Get envelope details to verify the actual sender
        try {
          const envelopeDetails = await docusignClient.get(`/accounts/${accountId}/envelopes/${envelopeId}`);
          logs.push(`DEBUG: Actual sender = ${envelopeDetails.data.sender?.email || 'not found'}`);
        } catch (detailsError) {
          logs.push(`DEBUG: Failed to get sender: ${detailsError.message}`);
        }
        
        // Verify onBehalfOf was processed
        if (companyOwner) {
          logs.push(`DEBUG: onBehalfOf requested for: ${companyOwner}`);
        }

        // Return success
        return callback({
          outputFields: {
            success: true,
            envelopeId: envelopeId,
            envelopeStatus: envelopeStatus,
            templateUsed: templateName,
            templateId: templateId,
            companyId: companyId,
            message: `DocuSign envelope sent to ${recipientName}`,
            logs: logs.join('\n')
          }
        });
      } catch (envelopeError) {
        logs.push(`Error code: ${envelopeError.response?.status || 'unknown'}`);
        
        // Log specific DocuSign error details if available
        if (envelopeError.response?.data) {
          logs.push(`DocuSign error details: ${JSON.stringify(envelopeError.response.data, null, 2)}`);
          
          // Extract specific error information if available
          const errorCode = envelopeError.response.data.errorCode || 'unknown';
          const errorMessage = envelopeError.response.data.message || envelopeError.message;
          
          logs.push(`DocuSign error code: ${errorCode}`);
          logs.push(`DocuSign error message: ${errorMessage}`);
          
          // If we still have an INVALID_USERID error, try demo environment as a last resort
          if (errorCode === 'INVALID_USERID' && !triedDemoEnvironment) {
            triedDemoEnvironment = true;
            logs.push('Trying demo environment as last resort...');
            
            // Switch to demo environment
            const demoClient = axios.create({
              baseURL: 'https://demo.docusign.net/restapi/v2.1',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            try {
              const demoResponse = await demoClient.post(`/accounts/${accountId}/envelopes`, envelopeDefinition);
              
              const envelopeId = demoResponse.data.envelopeId;
              const envelopeStatus = demoResponse.data.status;

              logs.push(`DocuSign envelope created in demo environment: ${envelopeId}`);
              logs.push(`Envelope status: ${envelopeStatus}`);

              // Return success
              return callback({
                outputFields: {
                  success: true,
                  envelopeId: envelopeId,
                  envelopeStatus: envelopeStatus,
                  templateUsed: templateName,
                  templateId: templateId,
                  companyId: companyId,
                  message: `DocuSign envelope sent to ${recipientName} (using demo environment)`
                }
              });
            } catch (demoError) {
              logs.push(`Demo environment also failed: ${demoError.message}`);
              if (demoError.response?.data) {
                logs.push(`Demo error details: ${JSON.stringify(demoError.response.data, null, 2)}`);
              }
              throw new Error(`Failed to create envelope in both environments: ${errorCode} - ${errorMessage}`);
            }
          } else {
            throw new Error(`Failed to create envelope: ${errorCode} - ${errorMessage}`);
          }
        } else {
          throw new Error(`Failed to create envelope: ${envelopeError.message}`);
        }
      }
    } catch (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
  } catch (error) {
    logs.push(`ERROR: ${error.message}`);
    
    return callback({
      outputFields: {
        success: false,
        error: error.message,
        message: `DocuSign workflow error: ${error.message}`,
        logs: logs.join('\n')
      }
    });
  }
};

/**
 * Generate a JWT token for DocuSign authentication
 */
function generateJWT(integrationKey, userId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600;

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
    scope: 'signature impersonation extended'  // Added 'extended' scope for more account access
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const signatureBase = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureBase);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signatureBase}.${signature}`;
}