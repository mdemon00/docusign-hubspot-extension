// src/app/extensions/DocusignViewer.jsx
// Redesigned User-Friendly DocuSign Viewer with improved UX
import React, { useState, useEffect } from "react";
import {
  Divider, Button, Text, Flex, hubspot, Heading, Box, Alert, LoadingSpinner, 
  Link, Tile, LoadingButton
} from "@hubspot/ui-extensions";

import EnvelopeTable from './components/EnvelopeTable.jsx';
import QuickFilters from './components/QuickFilters.jsx';
import AdvancedFilters from './components/AdvancedFilters.jsx';
import ConnectionStatus from './components/ConnectionStatus.jsx';

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <DocusignViewerExtension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

const DocusignViewerExtension = ({ context, runServerless, sendAlert }) => {
  // Authentication State
  const [authState, setAuthState] = useState({
    isAuthenticated: false, isAuthenticating: false, accessToken: null,
    account: null, baseUrl: null, error: null, consentUrl: null
  });

  // Envelopes State
  const [envelopesState, setEnvelopesState] = useState({
    envelopes: [], loading: false, error: null,
    pagination: { currentPage: 1, totalPages: 0, totalCount: 0, limit: 10, hasNextPage: false, hasPreviousPage: false }
  });

  // UI State
  const [uiState, setUiState] = useState({
    showAdvancedFilters: false,
    partnershipSending: false,
    selectedView: "recent", // recent, all, sent, completed
    showFilters: false
  });

  // Filters State
  const [filters, setFilters] = useState({
    status: 'all', searchTerm: '', fromDate: null, toDate: null,
    orderBy: 'last_modified', order: 'desc'
  });

  // Company Context Detection
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
      if (context?.crm?.objectId && context?.crm?.objectTypeId === '0-2') {
        setCompanyContext({
          companyId: context.crm.objectId,
          objectType: 'company',
          hasContext: true
        });
      } else {
        setCompanyContext({ hasContext: false });
      }
    } catch (error) {
      console.warn('Could not detect company context:', error);
      setCompanyContext({ hasContext: false });
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

    setUiState(prev => ({ ...prev, partnershipSending: true }));

    try {
      const response = await runServerless({
        name: "sendPartnershipAgreement",
        parameters: { companyId }
      });

      setUiState(prev => ({ ...prev, partnershipSending: false }));

      // Enhanced response handling
      const responseData = response?.response?.data || {};
      const actualSuccess = responseData.docusignReady && responseData.envelopeId;

      if (response?.status === "SUCCESS" && actualSuccess) {
        const companyName = responseData.companyName || 'Company';
        const envelopeId = responseData.envelopeId;
        
        sendAlert({ 
          message: `✅ Partnership Agreement sent successfully for ${companyName}`, 
          variant: "success" 
        });
        loadEnvelopes(1); // Refresh to show new envelope
      } else if (response?.status === "SUCCESS" && !responseData.docusignReady) {
        const companyName = responseData.companyName || 'Company';
        const missingFields = responseData.missingProperties || 'Unknown fields';
        const missingCount = responseData.missingPropertiesCount || 0;
        
        sendAlert({ 
          message: `❌ Cannot send DocuSign for ${companyName}. Missing ${missingCount} required field${missingCount !== 1 ? 's' : ''}: ${missingFields}`, 
          variant: "error" 
        });
      } else {
        const errorMessage = response?.response?.message || response?.message || "Unknown error";
        sendAlert({ 
          message: `❌ Partnership Agreement Error: ${errorMessage}`, 
          variant: "error" 
        });
      }
    } catch (error) {
      setUiState(prev => ({ ...prev, partnershipSending: false }));
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

  const handleQuickFilterChange = (filterType) => {
    const quickFilterMap = {
      recent: { status: 'all', orderBy: 'last_modified', order: 'desc' },
      sent: { status: 'sent' },
      completed: { status: 'completed' },
      all: { status: 'all' }
    };
    
    setUiState(prev => ({ ...prev, selectedView: filterType }));
    handleFilterChange(quickFilterMap[filterType] || {});
  };

  const renderAuthenticationError = () => (
    <Tile>
      <Alert variant="error">
        <Flex direction="column" gap="small">
          <Text format={{ fontWeight: "bold" }}>❌ DocuSign Authentication Required</Text>
          {authState.consentUrl ? (
            <Box>
              <Text variant="microcopy" marginBottom="small">
                Please authorize this application to access your DocuSign account:
              </Text>
              <Flex gap="small">
                <Link href={authState.consentUrl} external>
                  <Button variant="primary" size="xs">
                    🔗 Authorize DocuSign Access
                  </Button>
                </Link>
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
    </Tile>
  );

  return (
    <Box>
      {/* Header Section */}
      <Box marginBottom="large">
        <Flex justify="space-between" align="center" marginBottom="medium">
          <Box>
            <Heading>DocuSign Envelopes</Heading>
            <Text variant="microcopy" format={{ color: "medium" }}>
              Manage partnership agreements and envelopes
            </Text>
          </Box>
          <ConnectionStatus authState={authState} />
        </Flex>
        <Divider />
      </Box>

      {authState.isAuthenticating ? (
        <Box padding="large" style={{ textAlign: 'center' }}>
          <LoadingSpinner label="Connecting to DocuSign..." />
        </Box>
      ) : !authState.isAuthenticated ? (
        renderAuthenticationError()
      ) : (
        <Box>
          {/* Quick Stats & Filters */}
          <Tile marginBottom="large">
            <Flex justify="space-between" align="center" marginBottom="medium">
              <Text format={{ fontWeight: "bold" }}>
                📊 Envelope Overview ({envelopesState.pagination.totalCount || 0})
              </Text>
              <Flex gap="small">
                {companyContext?.hasContext && (
                  <LoadingButton
                    variant="primary"
                    onClick={() => handleSendPartnership(companyContext.companyId)}
                    loading={uiState.partnershipSending}
                    loadingText="Sending..."
                    disabled={uiState.partnershipSending}
                  >
                    📝 Send Partnership Agreement
                  </LoadingButton>
                )}
                <Button 
                  variant="transparent" 
                  size="xs"
                  onClick={() => setUiState(prev => ({ 
                    ...prev, showFilters: !prev.showFilters 
                  }))}
                >
                  🔍 {uiState.showFilters ? 'Hide' : 'Show'} Filters
                </Button>
                <Button variant="secondary" size="xs" onClick={() => loadEnvelopes(1)}>
                  🔄 Refresh
                </Button>
              </Flex>
            </Flex>

            <QuickFilters 
              selectedView={uiState.selectedView}
              onFilterChange={handleQuickFilterChange}
              envelopes={envelopesState.envelopes}
            />

            {uiState.showFilters && (
              <AdvancedFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                disabled={envelopesState.loading}
              />
            )}
          </Tile>

          {/* Envelopes List */}
          <EnvelopeTable 
            envelopes={envelopesState.envelopes}
            loading={envelopesState.loading}
            error={envelopesState.error}
            pagination={envelopesState.pagination}
            onRefresh={() => loadEnvelopes(1)}
            onPageChange={(newPage) => setEnvelopesState(prev => ({ 
              ...prev, pagination: { ...prev.pagination, currentPage: newPage } 
            }))}
          />

          {/* Help Footer */}
          <Tile marginTop="large">
            <Flex justify="space-between" align="center">
              <Box>
                <Text variant="microcopy" format={{ color: "medium" }}>
                  💡 Need help? Check our documentation or contact support
                </Text>
              </Box>
              <Box>
                <Text variant="microcopy" format={{ color: "medium" }}>
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </Box>
            </Flex>
          </Tile>
        </Box>
      )}
    </Box>
  );
};

export default DocusignViewerExtension;