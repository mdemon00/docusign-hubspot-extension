// src/app/app.functions/getDocusignAccount.js
// Get DocuSign account information and validate access

const axios = require('axios');

exports.main = async (context) => {
  try {
    const { accessToken, accountId, baseUrl } = context.parameters;

    console.log('🏢 Fetching DocuSign account information');

    // Validate required parameters
    if (!accessToken) {
      throw new Error('Access token is required');
    }

    if (!accountId || !baseUrl) {
      // If we don't have account info, get it from user info
      const userInfoResponse = await axios.get('https://account.docusign.com/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const userInfo = userInfoResponse.data;
      
      if (!userInfo.accounts || userInfo.accounts.length === 0) {
        throw new Error('No DocuSign accounts found for this user');
      }

      // Find default account or use first available
      const defaultAccount = userInfo.accounts.find(acc => acc.is_default) || userInfo.accounts[0];
      
      const accountData = {
        accountId: defaultAccount.account_id,
        accountName: defaultAccount.account_name,
        isDefault: defaultAccount.is_default || false,
        baseUrl: defaultAccount.base_uri.endsWith('/restapi/v2.1') 
          ? defaultAccount.base_uri 
          : defaultAccount.base_uri + (defaultAccount.base_uri.endsWith('/') ? 'restapi/v2.1' : '/restapi/v2.1')
      };

      console.log(`✅ Account info retrieved: ${accountData.accountName} (${accountData.accountId})`);

      return {
        status: "SUCCESS",
        message: "Account information retrieved successfully",
        data: {
          account: accountData,
          allAccounts: userInfo.accounts.map(acc => ({
            accountId: acc.account_id,
            accountName: acc.account_name,
            isDefault: acc.is_default || false,
            baseUrl: acc.base_uri
          }))
        },
        timestamp: Date.now()
      };
    }

    // If we have account info, validate account access
    try {
      const accountResponse = await axios.get(`${baseUrl}/accounts/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      const accountDetails = accountResponse.data;

      console.log(`✅ Account access validated: ${accountDetails.accountName}`);

      return {
        status: "SUCCESS",
        message: "Account access validated",
        data: {
          account: {
            accountId: accountDetails.accountId,
            accountName: accountDetails.accountName,
            planName: accountDetails.planInformation?.planName || 'Unknown Plan',
            planFeatures: accountDetails.planInformation?.planFeatures || [],
            isDefault: true,
            baseUrl: baseUrl
          },
          permissions: {
            canSend: true, // Assume true if we can access the account
            canManage: accountDetails.canManageAccount || false
          }
        },
        timestamp: Date.now()
      };

    } catch (accountError) {
      if (accountError.response?.status === 403) {
        throw new Error('Access denied to this DocuSign account');
      } else if (accountError.response?.status === 404) {
        throw new Error('DocuSign account not found');
      } else {
        throw new Error(`Failed to validate account access: ${accountError.message}`);
      }
    }

  } catch (error) {
    console.error("❌ Error getting DocuSign account information:", error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      return {
        status: "AUTH_ERROR",
        message: "DocuSign authentication expired. Please re-authenticate.",
        errorDetails: error.response.data,
        timestamp: Date.now()
      };
    }
    
    return {
      status: "ERROR",
      message: `Failed to get account information: ${error.message}`,
      errorDetails: error.toString(),
      timestamp: Date.now()
    };
  }
};