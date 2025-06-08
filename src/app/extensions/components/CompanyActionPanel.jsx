// src/app/extensions/components/CompanyActionPanel.jsx
import React from "react";
import { Tile, Flex, Box, Text, LoadingButton } from "@hubspot/ui-extensions";

const CompanyActionPanel = ({ companyContext, onSendPartnership, partnershipSending }) => {
  if (!companyContext?.hasContext) return null;

  return (
    <Tile marginBottom="large">
      <Flex justify="space-between" align="center" gap="large">
        <Box flex={1}>
          <Flex align="center" gap="small" marginBottom="xs">
            <Text style={{ fontSize: '20px' }}>🏢</Text>
            <Text format={{ fontWeight: "bold" }}>Company Context Detected</Text>
          </Flex>
          <Text variant="microcopy" format={{ color: "medium" }} marginBottom="xs">
            ID: {companyContext.companyId}
          </Text>
          <Text variant="microcopy" format={{ color: "medium" }}>
            Ready to send partnership agreements for this company
          </Text>
        </Box>
        <Box>
          <LoadingButton
            variant="primary"
            onClick={() => onSendPartnership(companyContext.companyId)}
            loading={partnershipSending}
            loadingText="Sending Agreement..."
            disabled={partnershipSending}
          >
            📝 Send Partnership Agreement
          </LoadingButton>
        </Box>
      </Flex>
    </Tile>
  );
};

export default CompanyActionPanel;