// src/app/extensions/DocusignViewer.jsx
// Enhanced DocuSign Viewer with webhook status logging and better debugging
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

  // Envelopes State - separate data for sent and completed
  const [envelopesState, setEnvelopesState] = useState({
    sentEnvelopes: [], completedEnvelopes: [], loading: false, error: null,
    pagination: { currentPage: 1, totalPages: 0, totalCount: 0, limit: 10, hasNextPage: false, hasPreviousPage: false }
  });

  // UI State
  const [uiState, setUiState] = useState({
    showAdvancedFilters: false,
    partnershipSending: false,
    selectedView: "sent",
    showFilters: false,
    lastWebhookStatus: null // Track webhook status
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

    // Enable debug logging
    console.log('🔍 DocuSign Extension Loaded - v1.2.0');
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken) {
      loadAllEnvelopes();
    }
  }, [authState.isAuthenticated, authState.accessToken, companyContext]);

  // Detect if we're in a company context
  const detectCompanyContext = () => {
    try {
      if (context?.crm?.objectId && context?.crm?.objectTypeId === '0-2') {
        setCompanyContext({
          companyId: context.crm.objectId,
          objectType: 'company',
          hasContext: true
        });
        console.log('🏢 Company context detected:', context.crm.objectId);
      } else {
        setCompanyContext({ hasContext: false });
        console.log('ℹ️ No company context detected');
      }
    } catch (error) {
      console.warn('⚠️ Could not detect company context:', error);
      setCompanyContext({ hasContext: false });
    }
  };

  const authenticateWithDocusign = async () => {
    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      console.log('🔐 Starting DocuSign authentication...');
      const response = await runServerless({ name: "docusignAuth", parameters: {} });

      if (response?.status === "SUCCESS" && response?.response?.data) {
        const data = response.response.data;
        setAuthState({
          isAuthenticated: true, isAuthenticating: false,
          accessToken: data.accessToken, account: data.account,
          baseUrl: data.baseUrl, error: null, consentUrl: null
        });
        console.log('✅ DocuSign authentication successful');
        sendAlert({ message: "✅ Connected to DocuSign successfully!", variant: "success" });
      } else if (response?.status === "CONSENT_REQUIRED") {
        console.log('🔗 DocuSign consent required');
        setAuthState({
          isAuthenticated: false, isAuthenticating: false,
          accessToken: null, account: null, baseUrl: null,
          error: "Consent required", consentUrl: response.response.data.consentUrl
        });
      } else {
        throw new Error(response?.response?.message || "Authentication failed");
      }
    } catch (error) {
      console.error('❌ DocuSign authentication failed:', error);
      setAuthState({
        isAuthenticated: false, isAuthenticating: false,
        accessToken: null, account: null, baseUrl: null,
        error: error.message, consentUrl: null
      });
      sendAlert({ message: `❌ Authentication Error: ${error.message}`, variant: "error" });
    }
  };

  const loadAllEnvelopes = async () => {
    setEnvelopesState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('📋 Loading all DocuSign envelopes (sent and completed)...');
      if (companyContext?.hasContext) {
        console.log('🏢 Loading envelopes for company:', companyContext.companyId);
      }

      // Load both sent and completed envelopes in parallel
      const [sentResponse, completedResponse] = await Promise.all([
        runServerless({
          name: "listDocusignEnvelopes",
          parameters: {
            accessToken: authState.accessToken, baseUrl: authState.baseUrl,
            accountId: authState.account.accountId, page: 1, limit: 50,
            status: 'sent',
            companyId: companyContext?.hasContext ? companyContext.companyId : null
          }
        }),
        runServerless({
          name: "listDocusignEnvelopes",
          parameters: {
            accessToken: authState.accessToken, baseUrl: authState.baseUrl,
            accountId: authState.account.accountId, page: 1, limit: 50,
            status: 'completed',
            companyId: companyContext?.hasContext ? companyContext.companyId : null
          }
        })
      ]);

      let sentEnvelopes = [];
      let completedEnvelopes = [];
      let hasError = false;
      let errorMessage = '';

      // Process sent envelopes
      if (sentResponse?.status === "SUCCESS") {
        const sentData = sentResponse.response?.data || sentResponse.response;
        sentEnvelopes = sentData.envelopes || [];
        console.log('✅ Sent envelopes loaded:', sentEnvelopes.length);
      } else if (sentResponse?.status === "AUTH_ERROR") {
        setAuthState(prev => ({ ...prev, isAuthenticated: false, accessToken: null }));
        sendAlert({ message: "🔄 Session expired. Please re-authenticate.", variant: "warning" });
        return;
      } else {
        hasError = true;
        errorMessage = sentResponse?.response?.message || "Failed to load sent envelopes";
      }

      // Process completed envelopes
      if (completedResponse?.status === "SUCCESS") {
        const completedData = completedResponse.response?.data || completedResponse.response;
        completedEnvelopes = completedData.envelopes || [];
        console.log('✅ Completed envelopes loaded:', completedEnvelopes.length);
      } else if (completedResponse?.status === "AUTH_ERROR") {
        setAuthState(prev => ({ ...prev, isAuthenticated: false, accessToken: null }));
        sendAlert({ message: "🔄 Session expired. Please re-authenticate.", variant: "warning" });
        return;
      } else {
        hasError = true;
        errorMessage = errorMessage || completedResponse?.response?.message || "Failed to load completed envelopes";
      }

      setEnvelopesState(prev => ({
        ...prev,
        sentEnvelopes,
        completedEnvelopes,
        loading: false,
        error: hasError ? errorMessage : null
      }));

      console.log('✅ All envelopes loaded successfully:', {
        sent: sentEnvelopes.length,
        completed: completedEnvelopes.length,
        total: sentEnvelopes.length + completedEnvelopes.length
      });

    } catch (error) {
      console.error('❌ Failed to load envelopes:', error);
      setEnvelopesState(prev => ({ ...prev, loading: false, error: error.message }));
      sendAlert({ message: `❌ Failed to load envelopes: ${error.message}`, variant: "error" });
    }
  };

  // Enhanced partnership agreement send with webhook status tracking
  // Enhanced partnership agreement send with webhook status tracking
  const handleSendPartnership = async (companyId) => {
    if (!companyId) {
      sendAlert({ message: "❌ No company ID available", variant: "error" });
      return;
    }

    console.log('📝 Starting partnership agreement validation for company:', companyId);
    setUiState(prev => ({ ...prev, partnershipSending: true, lastWebhookStatus: null }));

    try {
      const startTime = Date.now();
      const response = await runServerless({
        name: "sendPartnershipAgreement",
        parameters: { companyId }
      });

      const duration = Date.now() - startTime;
      setUiState(prev => ({ ...prev, partnershipSending: false }));

      // Enhanced response handling for VALIDATION-ONLY mode
      const responseData = response?.response?.data || {};

      // Updated success logic for validation-only mode (no envelopeId expected)
      const actualSuccess = response?.status === "SUCCESS" && responseData.docusignReady;

      const webhookStatus = {
        sent: responseData.webhookSent || false,
        attempts: responseData.webhookAttempts || 0,
        scenarioType: responseData.scenarioType || 'unknown'
      };

      // Update webhook status in UI state
      setUiState(prev => ({ ...prev, lastWebhookStatus: webhookStatus }));

      // Log detailed response info
      console.log('📊 Partnership Agreement Validation Response:', {
        status: response?.status,
        success: actualSuccess,
        webhookStatus: webhookStatus,
        duration: `${duration}ms`,
        scenarioType: responseData.scenarioType,
        missingFields: responseData.missingProperties,
        validationOnly: responseData.validationOnly
      });

      if (response?.status === "SUCCESS" && actualSuccess) {
        // VALIDATION SUCCESS - Company is ready for DocuSign
        const companyName = responseData.companyName || 'Company';

        console.log('✅ Partnership Agreement validation passed:', {
          company: companyName,
          webhookSent: webhookStatus.sent,
          validationOnly: responseData.validationOnly
        });

        sendAlert({
          message: `✅ ${companyName} is ready for DocuSign creation${webhookStatus.sent ? ' (Workflow triggered)' : ' (Warning: Workflow notification failed)'}`,
          variant: "success"
        });
        loadAllEnvelopes(); // Refresh to show any new envelopes created by workflow

      } else if (response?.status === "SUCCESS" && !responseData.docusignReady) {
        // VALIDATION FAILED - Missing required fields
        const companyName = responseData.companyName || 'Company';
        const missingFields = responseData.missingProperties || 'Unknown fields';
        const missingCount = responseData.missingPropertiesCount || 0;

        console.log('❌ DocuSign validation failed:', {
          company: companyName,
          missingFields: missingFields,
          missingCount: missingCount,
          webhookSent: webhookStatus.sent
        });

        sendAlert({
          message: `❌ Cannot create DocuSign for ${companyName}. Missing ${missingCount} required field${missingCount !== 1 ? 's' : ''}: ${missingFields}${webhookStatus.sent ? ' (Team notified)' : ' (Warning: Notification failed)'}`,
          variant: "error"
        });

      } else {
        // SYSTEM ERROR
        const errorMessage = response?.response?.message || response?.message || "Unknown error";
        console.error('❌ Partnership Agreement System Error:', {
          error: errorMessage,
          webhookStatus: webhookStatus,
          fullResponse: response
        });

        sendAlert({
          message: `❌ Partnership Agreement Error: ${errorMessage}${webhookStatus.sent ? ' (Team notified)' : ' (Warning: Notification failed)'}`,
          variant: "error"
        });
      }
    } catch (error) {
      console.error('❌ Failed to validate partnership agreement:', error);
      setUiState(prev => ({ ...prev, partnershipSending: false }));
      sendAlert({
        message: `❌ Failed to validate partnership agreement: ${error.message}`,
        variant: "error"
      });
    }
  };

  const handleQuickFilterChange = (filterType) => {
    // Simply switch the view - no API calls needed since data is already loaded
    setUiState(prev => ({ ...prev, selectedView: filterType }));
    console.log('🔄 Switched to view:', filterType);
  };

  const renderWebhookStatus = () => {
    if (!uiState.lastWebhookStatus) return null;

    const { sent, attempts, scenarioType } = uiState.lastWebhookStatus;

    return (
      <Box marginTop="small">
        <Alert variant={sent ? "success" : "warning"}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text variant="microcopy" format={{ fontWeight: "bold" }}>
                {sent ? '✅ Webhook Sent' : '⚠️ Webhook Failed'}
              </Text>
              <Text variant="microcopy" format={{ color: "medium" }}>
                {sent
                  ? `Team notifications sent successfully (${attempts} attempt${attempts !== 1 ? 's' : ''})`
                  : `Failed to send notifications after ${attempts} attempt${attempts !== 1 ? 's' : ''}`
                }
              </Text>
            </Box>
            <Box>
              <Text variant="microcopy" format={{ color: "medium" }}>
                Scenario: {scenarioType}
              </Text>
            </Box>
          </Flex>
        </Alert>
      </Box>
    );
  };

  const renderDebugInfo = () => {
    if (!uiState.debugMode) return null;

    return (
      <Tile marginTop="large">
        <Flex justify="space-between" align="center" marginBottom="medium">
          <Text format={{ fontWeight: "bold" }}>🔍 Debug Information</Text>
          <Button variant="transparent" size="xs" onClick={() => setUiState(prev => ({ ...prev, debugMode: false }))}>
            Hide Debug
          </Button>
        </Flex>

        <Box style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
          <Text variant="microcopy">Company Context: {JSON.stringify(companyContext, null, 2)}</Text>
          <br />
          <Text variant="microcopy">Auth State: {JSON.stringify({
            isAuthenticated: authState.isAuthenticated,
            hasToken: !!authState.accessToken,
            accountName: authState.account?.accountName
          }, null, 2)}</Text>
          <br />
          <Text variant="microcopy">Last Webhook Status: {JSON.stringify(uiState.lastWebhookStatus, null, 2)}</Text>
        </Box>
      </Tile>
    );
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
            <Text variant="microcopy" format={{ color: "medium" }}>
              {companyContext?.hasContext 
                ? `Manage partnership agreements and envelopes for this company`
                : `Manage partnership agreements and envelopes`
              }
            </Text>
          </Box>
          <Flex direction="column" align="end" gap="small">
            <ConnectionStatus authState={authState} />
            {companyContext?.hasContext && (
              <LoadingButton
                variant="primary"
                onClick={() => handleSendPartnership(companyContext.companyId)}
                loading={uiState.partnershipSending}
                loadingText="Sending..."
                disabled={uiState.partnershipSending}
                size="small"
              >
                📝 Send Partnership Agreement
              </LoadingButton>
            )}
          </Flex>
        </Flex>

        {/* Webhook Status Display */}
        {/* {renderWebhookStatus()} */}

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
                📊 {companyContext?.hasContext ? 'Company' : 'All'} Envelopes ({(envelopesState.sentEnvelopes?.length || 0) + (envelopesState.completedEnvelopes?.length || 0)})
              </Text>
              {/* <Flex gap="small">
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
              </Flex> */}
            </Flex>

            <QuickFilters
              selectedView={uiState.selectedView}
              onFilterChange={handleQuickFilterChange}
              sentEnvelopes={envelopesState.sentEnvelopes}
              completedEnvelopes={envelopesState.completedEnvelopes}
            />

            {/* {uiState.showFilters && (
              <AdvancedFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                disabled={envelopesState.loading}
              />
            )} */}
          </Tile>

          {/* Envelopes List */}
          <Tile>
            <EnvelopeTable
              envelopes={uiState.selectedView === 'sent' ? envelopesState.sentEnvelopes : envelopesState.completedEnvelopes}
              loading={envelopesState.loading}
              error={envelopesState.error}
              onRefresh={loadAllEnvelopes}
            />
          </Tile>

          {/* Help Footer */}
          <Tile marginTop="large">
            <Flex justify="space-between" align="center">
              <Box>
                <Text variant="microcopy" format={{ color: "medium" }}>
                  💡 Need help? Check function logs for detailed webhook information
                </Text>
              </Box>
              <Flex gap="medium" align="center">
                <Text variant="microcopy" format={{ color: "medium" }}>
                  v1.2.0
                </Text>
                <Text variant="microcopy" format={{ color: "medium" }}>
                  Last updated: {new Date().toLocaleTimeString()}
                </Text>
              </Flex>
            </Flex>
          </Tile>
        </Box>
      )}
    </Box>
  );
};

export default DocusignViewerExtension;