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
