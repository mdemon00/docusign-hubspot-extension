// DocuSign Viewer Main Component with Partnership Send functionality
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

  // Partnership send state
  const [partnershipState, setPartnershipState] = useState({
    sending: false,
    lastResult: null
  });

  // Company context from HubSpot
  const [companyContext, setCompanyContext] = useState(null);

  useEffect(() => { 
    authenticateWithDocusign(); 
    detectCompanyContext();
  }, []);
  
  useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken) {
      loadEnvelopes();
    }
  }, [authState.isAuthenticated, authState.accessToken, filters, envelopesState.pagination.currentPage]);

  // Detect if we're in a company context
  const detectCompanyContext = () => {
    try {
      // Check if we're on a company record page
      if (context?.crm?.objectId && context?.crm?.objectTypeId === '0-2') {
        setCompanyContext({
          companyId: context.crm.objectId,
          objectType: 'company'
        });
      }
      // You can also check for deals or contacts and get associated company
      else if (context?.crm?.objectId) {
        // For now, we'll only support direct company context
        // In the future, you could add logic to fetch associated company from deals/contacts
        setCompanyContext(null);
      }
    } catch (error) {
      console.warn('Could not detect company context:', error);
      setCompanyContext(null);
    }
  };

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
      sendAlert({ message: `❌ Authentication Error: ${error.message}`, variant: "error" });
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
        sendAlert({ message: "🔄 Session expired. Please re-authenticate.", variant: "warning" });
      } else {
        throw new Error(response?.response?.message || "Failed to load envelopes");
      }
    } catch (error) {
      setEnvelopesState(prev => ({ ...prev, loading: false, error: error.message }));
      sendAlert({ message: `❌ Failed to load envelopes: ${error.message}`, variant: "error" });
    }
  };

  // Handle partnership agreement send
  const handleSendPartnership = async (companyId) => {
    if (!companyId) {
      sendAlert({ message: "❌ No company ID available", variant: "error" });
      return;
    }

    setPartnershipState(prev => ({ ...prev, sending: true }));

    try {
      const response = await runServerless({
        name: "sendPartnershipAgreement",
        parameters: { companyId }
      });

      setPartnershipState(prev => ({ 
        ...prev, 
        sending: false, 
        lastResult: response 
      }));

      // Check if the actual process was successful (not just that the function ran)
      const responseData = response?.response?.data || {};
      const actualSuccess = responseData.docusignReady && responseData.envelopeId;

      if (response?.status === "SUCCESS" && actualSuccess) {
        // True success - envelope was created
        const companyName = responseData.companyName || 'Company';
        const envelopeId = responseData.envelopeId;
        
        sendAlert({ 
          message: `✅ Partnership Agreement sent successfully for ${companyName} (${envelopeId})`, 
          variant: "success" 
        });
        // Refresh envelopes to show the new one
        loadEnvelopes(1);
      } else if (response?.status === "SUCCESS" && !responseData.docusignReady) {
        // Function ran but validation failed
        const companyName = responseData.companyName || 'Company';
        const missingFields = responseData.missingProperties || 'Unknown fields';
        const missingCount = responseData.missingPropertiesCount || 0;
        
        sendAlert({ 
          message: `❌ DocuSign Cannot Be Sent for ${companyName}\n\nMissing ${missingCount} required field${missingCount !== 1 ? 's' : ''}:\n${missingFields}\n\nPlease complete these fields and try again.\nWebhook sent to create notification task.`, 
          variant: "error" 
        });
      } else if (response?.status === "ERROR") {
        // Function error or validation failed
        const companyName = responseData.companyName || 'Company';
        const errorMessage = response?.response?.message || response?.message || "Unknown error";
        const missingFields = responseData.missingProperties;
        
        if (missingFields) {
          // Validation error
          const missingCount = responseData.missingPropertiesCount || 0;
          sendAlert({ 
            message: `❌ DocuSign Cannot Be Sent for ${companyName}\n\nMissing ${missingCount} required field${missingCount !== 1 ? 's' : ''}:\n${missingFields}\n\nPlease complete these fields and try again.\nWebhook sent to create notification task.`, 
            variant: "error" 
          });
        } else {
          // Other error
          sendAlert({ 
            message: `❌ Partnership Agreement Error: ${errorMessage}\n\nWebhook sent to process notifications.`, 
            variant: "error" 
          });
        }
      } else {
        // Unexpected response format
        const errorMessage = response?.response?.message || response?.message || "Unexpected response format";
        sendAlert({ 
          message: `⚠️ Partnership process completed with unexpected result: ${errorMessage}\n\nWebhook sent - check workflow for details.`, 
          variant: "warning" 
        });
      }
    } catch (error) {
      setPartnershipState(prev => ({ ...prev, sending: false }));
      sendAlert({ 
        message: `❌ Failed to send partnership agreement: ${error.message}`, 
        variant: "error" 
      });
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
            {companyContext && (
              <Text variant="microcopy" format={{ color: 'success' }}>
                📋 Company context detected (ID: {companyContext.companyId})
              </Text>
            )}
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
            <EnvelopeTable 
              envelopes={envelopesState.envelopes} 
              loading={envelopesState.loading} 
              error={envelopesState.error} 
              onRefresh={() => loadEnvelopes(1)}
              onSendPartnership={handleSendPartnership}
              partnershipSending={partnershipState.sending}
              companyContext={companyContext}
            />
          </Box>
          {envelopesState.envelopes.length > 0 && (
            <Box marginTop="medium">
              <Pagination pagination={envelopesState.pagination} onPageChange={handlePageChange} 
                         disabled={envelopesState.loading} />
            </Box>
          )}
          
          {/* Partnership send status */}
          {partnershipState.lastResult && (
            <Box marginTop="medium">
              <Alert variant={partnershipState.lastResult.status === "SUCCESS" ? "success" : "info"}>
                <Text variant="microcopy">
                  Last partnership send: {partnershipState.lastResult.message || 'Completed - check workflow for details'}
                </Text>
              </Alert>
            </Box>
          )}
        </Box>
      ) : (
        renderAuthenticationError()
      )}
    </Flex>
  );
};

export default DocusignViewerExtension;