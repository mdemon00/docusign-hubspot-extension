#!/bin/bash
# Complete DocuSign HubSpot Extension - File Creation Script

# This script creates all the necessary files for the DocuSign HubSpot integration
# Run this after creating the basic project structure

echo "Creating DocuSign HubSpot Extension files..."

# Create backend authentication function
cat > src/app/app.functions/docusignAuth.js << 'EOF'
// DocuSign JWT Authentication Function
const crypto = require('crypto');
const axios = require('axios');

exports.main = async (context) => {
  const logs = [];
  logs.push('Starting DocuSign authentication process');

  try {
    // Get credentials from environment
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
    const userId = process.env.DOCUSIGN_USER_ID;
    const privateKey = process.env.DOCUSIGN_PRIVATE_KEY || `-----BEGIN RSA PRIVATE KEY-----
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

    if (!integrationKey || !userId) {
      throw new Error('Missing required DocuSign credentials');
    }

    // Generate JWT token
    const jwtToken = generateJWT(integrationKey, userId, privateKey);
    
    // Request access token
    try {
      const response = await axios.post(
        'https://account.docusign.com/oauth/token',
        `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const accessToken = response.data.access_token;

      // Get user account info
      const userInfoResponse = await axios.get('https://account.docusign.com/oauth/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const userInfo = userInfoResponse.data;
      if (!userInfo.accounts || userInfo.accounts.length === 0) {
        throw new Error('No DocuSign accounts found');
      }

      const defaultAccount = userInfo.accounts.find(acc => acc.is_default) || userInfo.accounts[0];
      const baseUrl = defaultAccount.base_uri.endsWith('/restapi/v2.1') 
        ? defaultAccount.base_uri 
        : defaultAccount.base_uri + '/restapi/v2.1';

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
      if (tokenError.response?.data?.error === 'consent_required') {
        const consentUrl = `https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=https://www.docusign.com`;
        
        return {
          status: "CONSENT_REQUIRED",
          message: "DocuSign JWT consent is required",
          data: { consentUrl },
          timestamp: Date.now()
        };
      } else {
        throw new Error(`Authentication failed: ${tokenError.message}`);
      }
    }

  } catch (error) {
    console.error("❌ DocuSign authentication error:", error);
    return {
      status: "ERROR",
      message: `Authentication failed: ${error.message}`,
      timestamp: Date.now()
    };
  }
};

function generateJWT(integrationKey, userId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: integrationKey,
    sub: userId,
    iat: now,
    exp: now + 3600,
    aud: 'account.docusign.com',
    scope: 'signature impersonation extended'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signatureBase = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureBase);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${signatureBase}.${signature}`;
}
EOF

# Create envelope listing function
cat > src/app/app.functions/listDocusignEnvelopes.js << 'EOF'
// List DocuSign Envelopes Function
const axios = require('axios');

exports.main = async (context) => {
  try {
    const {
      accessToken, baseUrl, accountId,
      page = 1, limit = 10, status = 'all',
      searchTerm = '', fromDate = null, toDate = null,
      orderBy = 'last_modified', order = 'desc'
    } = context.parameters;

    if (!accessToken || !baseUrl || !accountId) {
      throw new Error('Missing authentication parameters');
    }

    const startPosition = (page - 1) * limit;
    const queryParams = new URLSearchParams({
      count: limit.toString(),
      start_position: startPosition.toString(),
      order_by: orderBy,
      order: order
    });

    if (status && status !== 'all') queryParams.append('status', status);
    if (fromDate) queryParams.append('from_date', fromDate);
    if (toDate) queryParams.append('to_date', toDate);
    if (searchTerm.trim()) queryParams.append('search_text', searchTerm.trim());

    const apiUrl = `${baseUrl}/accounts/${accountId}/envelopes?${queryParams}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    const data = response.data;
    const processedEnvelopes = (data.envelopes || []).map(envelope => ({
      envelopeId: envelope.envelopeId,
      emailSubject: envelope.emailSubject || 'No Subject',
      status: envelope.status,
      statusDateTime: envelope.statusChangedDateTime,
      sender: {
        userName: envelope.sender?.userName || 'Unknown',
        email: envelope.sender?.email || ''
      },
      createdDateTime: envelope.createdDateTime,
      lastModifiedDateTime: envelope.lastModifiedDateTime,
      recipientsCount: getRecipientsCount(envelope),
      displayData: {
        statusColor: getStatusColor(envelope.status),
        statusLabel: getStatusLabel(envelope.status),
        recipientsText: getRecipientsText(envelope),
        lastUpdated: formatDate(envelope.lastModifiedDateTime),
        createDate: formatDate(envelope.createdDateTime),
        senderDisplay: envelope.sender?.userName || 'Unknown'
      }
    }));

    const totalCount = parseInt(data.totalSetSize) || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      status: "SUCCESS",
      message: `Retrieved ${processedEnvelopes.length} envelopes`,
      data: {
        envelopes: processedEnvelopes,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          startPosition,
          endPosition: Math.min(startPosition + limit, totalCount)
        }
      },
      timestamp: Date.now()
    };

  } catch (error) {
    if (error.response?.status === 401) {
      return {
        status: "AUTH_ERROR",
        message: "DocuSign authentication expired",
        timestamp: Date.now()
      };
    }
    
    return {
      status: "ERROR",
      message: `Failed to fetch envelopes: ${error.message}`,
      timestamp: Date.now()
    };
  }
};

function getRecipientsCount(envelope) {
  if (!envelope.recipients) return 0;
  let count = 0;
  if (envelope.recipients.signers) count += envelope.recipients.signers.length;
  if (envelope.recipients.carbonCopies) count += envelope.recipients.carbonCopies.length;
  return count;
}

function getRecipientsText(envelope) {
  const count = getRecipientsCount(envelope);
  return count === 0 ? 'No recipients' : count === 1 ? '1 recipient' : `${count} recipients`;
}

function getStatusColor(status) {
  const colors = {
    'sent': '#f39c12', 'delivered': '#3498db', 'completed': '#27ae60',
    'declined': '#e74c3c', 'voided': '#95a5a6', 'created': '#9b59b6',
    'signed': '#27ae60', 'corrected': '#f39c12'
  };
  return colors[status?.toLowerCase()] || '#95a5a6';
}

function getStatusLabel(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown';
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return dateString; }
}
EOF

# Create account function
cat > src/app/app.functions/getDocusignAccount.js << 'EOF'
// Get DocuSign Account Function
const axios = require('axios');

exports.main = async (context) => {
  try {
    const { accessToken } = context.parameters;

    if (!accessToken) {
      throw new Error('Access token is required');
    }

    const userInfoResponse = await axios.get('https://account.docusign.com/oauth/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const userInfo = userInfoResponse.data;
    if (!userInfo.accounts?.length) {
      throw new Error('No DocuSign accounts found');
    }

    const defaultAccount = userInfo.accounts.find(acc => acc.is_default) || userInfo.accounts[0];
    const baseUrl = defaultAccount.base_uri.endsWith('/restapi/v2.1') 
      ? defaultAccount.base_uri 
      : defaultAccount.base_uri + '/restapi/v2.1';

    return {
      status: "SUCCESS",
      message: "Account information retrieved",
      data: {
        account: {
          accountId: defaultAccount.account_id,
          accountName: defaultAccount.account_name,
          isDefault: defaultAccount.is_default || false,
          baseUrl
        }
      },
      timestamp: Date.now()
    };

  } catch (error) {
    return {
      status: "ERROR",
      message: `Failed to get account: ${error.message}`,
      timestamp: Date.now()
    };
  }
};
EOF

# Create main React component
cat > src/app/extensions/DocusignViewer.jsx << 'EOF'
// DocuSign Viewer Main Component
import React, { useState, useEffect } from "react";
import {
  Divider, Button, Text, Flex, hubspot, Heading, Box, Alert, LoadingSpinner, Link
} from "@hubspot/ui-extensions";

import EnvelopeTable from './components/EnvelopeTable.jsx';
import SearchFilter from './components/SearchFilter.jsx';
import Pagination from './components/Pagination.jsx';

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <DocusignViewerExtension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

const DocusignViewerExtension = ({ context, runServerless, sendAlert }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false, isAuthenticating: false, accessToken: null,
    account: null, baseUrl: null, error: null, consentUrl: null
  });

  const [envelopesState, setEnvelopesState] = useState({
    envelopes: [], loading: false, error: null,
    pagination: { currentPage: 1, totalPages: 0, totalCount: 0, limit: 10, hasNextPage: false, hasPreviousPage: false }
  });

  const [filters, setFilters] = useState({
    status: 'all', searchTerm: '', fromDate: null, toDate: null,
    orderBy: 'last_modified', order: 'desc'
  });

  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => { authenticateWithDocusign(); }, []);
  
  useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken) {
      loadEnvelopes();
    }
  }, [authState.isAuthenticated, authState.accessToken, filters, envelopesState.pagination.currentPage]);

  const authenticateWithDocusign = async () => {
    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const response = await runServerless({ name: "docusignAuth", parameters: {} });

      if (response?.status === "SUCCESS" && response?.response?.data) {
        const data = response.response.data;
        setAuthState({
          isAuthenticated: true, isAuthenticating: false,
          accessToken: data.accessToken, account: data.account,
          baseUrl: data.baseUrl, error: null, consentUrl: null
        });
        sendAlert({ message: "✅ Connected to DocuSign successfully!", variant: "success" });
      } else if (response?.status === "CONSENT_REQUIRED") {
        setAuthState({
          isAuthenticated: false, isAuthenticating: false,
          accessToken: null, account: null, baseUrl: null,
          error: "Consent required", consentUrl: response.response.data.consentUrl
        });
      } else {
        throw new Error(response?.response?.message || "Authentication failed");
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false, isAuthenticating: false,
        accessToken: null, account: null, baseUrl: null,
        error: error.message, consentUrl: null
      });
      setAlertMessage({ message: `❌ Authentication Error: ${error.message}`, variant: "error" });
    }
  };

  const loadEnvelopes = async (page = envelopesState.pagination.currentPage) => {
    setEnvelopesState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await runServerless({
        name: "listDocusignEnvelopes",
        parameters: {
          accessToken: authState.accessToken, baseUrl: authState.baseUrl,
          accountId: authState.account.accountId, page, limit: envelopesState.pagination.limit,
          ...filters
        }
      });

      if (response?.status === "SUCCESS") {
        const data = response.response.data;
        setEnvelopesState(prev => ({
          ...prev, envelopes: data.envelopes, loading: false, error: null,
          pagination: { ...prev.pagination, ...data.pagination }
        }));
      } else if (response?.status === "AUTH_ERROR") {
        setAuthState(prev => ({ ...prev, isAuthenticated: false, accessToken: null }));
        setAlertMessage({ message: "🔄 Session expired. Please re-authenticate.", variant: "warning" });
      } else {
        throw new Error(response?.response?.message || "Failed to load envelopes");
      }
    } catch (error) {
      setEnvelopesState(prev => ({ ...prev, loading: false, error: error.message }));
      setAlertMessage({ message: `❌ Failed to load envelopes: ${error.message}`, variant: "error" });
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setEnvelopesState(prev => ({ ...prev, pagination: { ...prev.pagination, currentPage: 1 } }));
  };

  const handlePageChange = (newPage) => {
    setEnvelopesState(prev => ({ ...prev, pagination: { ...prev.pagination, currentPage: newPage } }));
  };

  const renderAuthenticationError = () => (
    <Box marginTop="medium">
      <Alert variant="error">
        <Flex direction="column" gap="small">
          <Text>❌ DocuSign Authentication Required</Text>
          {authState.consentUrl ? (
            <Box>
              <Text variant="microcopy" marginBottom="small">
                Please authorize this application to access your DocuSign account:
              </Text>
              <Flex gap="small">
                <Link href={authState.consentUrl} external>🔗 Authorize DocuSign Access</Link>
                <Button variant="secondary" size="xs" onClick={authenticateWithDocusign} 
                        disabled={authState.isAuthenticating}>
                  ↻ Retry After Authorization
                </Button>
              </Flex>
            </Box>
          ) : (
            <Box>
              <Text variant="microcopy" marginBottom="small">Error: {authState.error}</Text>
              <Button variant="secondary" onClick={authenticateWithDocusign} disabled={authState.isAuthenticating}>
                {authState.isAuthenticating ? "Authenticating..." : "🔄 Retry Authentication"}
              </Button>
            </Box>
          )}
        </Flex>
      </Alert>
    </Box>
  );

  return (
    <Flex direction="column" gap="large">
      <Box>
        <Divider />
        <Flex justify="space-between" align="center">
          <Box>
            <Heading>DocuSign Integration</Heading>
            <Text variant="microcopy">View and manage DocuSign envelopes</Text>
          </Box>
          <Box>
            {authState.isAuthenticated ? (
              <Flex direction="column" align="end">
                <Text variant="microcopy" format={{ color: 'success', fontWeight: "bold" }}>✅ Connected</Text>
                <Text variant="microcopy" format={{ color: 'medium' }}>
                  {authState.account?.accountName || 'DocuSign Account'}
                </Text>
              </Flex>
            ) : (
              <Text variant="microcopy" format={{ color: authState.isAuthenticating ? 'warning' : 'error' }}>
                {authState.isAuthenticating ? "🔄 Connecting..." : "❌ Not Connected"}
              </Text>
            )}
          </Box>
        </Flex>
        <Divider />
      </Box>

      {authState.isAuthenticating ? (
        <Box padding="large" style={{ textAlign: 'center' }}>
          <LoadingSpinner label="Connecting to DocuSign..." />
        </Box>
      ) : authState.isAuthenticated ? (
        <Box>
          <SearchFilter filters={filters} onFilterChange={handleFilterChange} disabled={envelopesState.loading} />
          <Box marginTop="medium">
            <EnvelopeTable envelopes={envelopesState.envelopes} loading={envelopesState.loading} 
                          error={envelopesState.error} onRefresh={() => loadEnvelopes(1)} />
          </Box>
          {envelopesState.envelopes.length > 0 && (
            <Box marginTop="medium">
              <Pagination pagination={envelopesState.pagination} onPageChange={handlePageChange} 
                         disabled={envelopesState.loading} />
            </Box>
          )}
        </Box>
      ) : (
        renderAuthenticationError()
      )}

      {alertMessage && <Alert variant={alertMessage.variant}>{alertMessage.message}</Alert>}
    </Flex>
  );
};

export default DocusignViewerExtension;
EOF

echo "✅ All files created successfully!"
echo "📁 Project structure is ready for DocuSign HubSpot Integration"
echo ""
echo "Next steps:"
echo "1. Copy the component files to src/app/extensions/components/"
echo "2. Copy the utils files to src/app/extensions/utils/"  
echo "3. Set your DocuSign environment variables"
echo "4. Run 'npm run dev' to start development"