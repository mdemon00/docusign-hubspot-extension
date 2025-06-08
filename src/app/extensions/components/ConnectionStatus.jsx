// src/app/extensions/components/ConnectionStatus.jsx
import React from "react";
import { Box, Text, Flex } from "@hubspot/ui-extensions";

const ConnectionStatus = ({ authState }) => {
  if (authState.isAuthenticating) {
    return (
      <Box>
        <Text variant="microcopy" format={{ color: 'warning', fontWeight: "bold" }}>
          🔄 Connecting...
        </Text>
        <Text variant="microcopy" format={{ color: "medium" }}>
          Please wait
        </Text>
      </Box>
    );
  }

  if (authState.isAuthenticated) {
    return (
      <Flex direction="column" align="end">
        <Text variant="microcopy" format={{ color: 'success', fontWeight: "bold" }}>
          ✅ Connected
        </Text>
        <Text variant="microcopy" format={{ color: "medium" }}>
          {authState.account?.accountName || 'DocuSign Account'}
        </Text>
      </Flex>
    );
  }

  return (
    <Box>
      <Text variant="microcopy" format={{ color: 'error', fontWeight: "bold" }}>
        ❌ Not Connected
      </Text>
      <Text variant="microcopy" format={{ color: "medium" }}>
        Authentication required
      </Text>
    </Box>
  );
};

export default ConnectionStatus;