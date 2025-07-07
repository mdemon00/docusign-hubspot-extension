// src/app/extensions/components/EnvelopeTable.jsx
// Enhanced envelope table with detailed recipient information display
import React from "react";
import {
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Text, Flex, Box, LoadingSpinner, Alert, Button
} from "@hubspot/ui-extensions";

import StatusBadge from './StatusBadge.jsx';
import RecipientsList from './RecipientsList.jsx';

const EnvelopeTable = ({ 
  envelopes, 
  loading, 
  error, 
  onRefresh
}) => {
  if (loading) {
    return (
      <Box padding="large" style={{ textAlign: 'center' }}>
        <LoadingSpinner label="Loading envelopes..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <Flex justify="space-between" align="center">
          <Text>❌ {error}</Text>
          <Button variant="secondary" size="xs" onClick={onRefresh}>🔄 Retry</Button>
        </Flex>
      </Alert>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" marginBottom="medium">
        <Text format={{ fontWeight: "bold" }}>
          📋 {envelopes?.length || 0} envelope{(envelopes?.length || 0) !== 1 ? 's' : ''}
        </Text>
        <Button variant="secondary" size="xs" onClick={onRefresh}>🔄 Refresh</Button>
      </Flex>

      {!envelopes?.length ? (
        <Box padding="medium" style={{ textAlign: 'center' }}>
          <Text variant="microcopy" format={{ color: 'medium' }}>📭 No envelopes found</Text>
        </Box>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>NAME</TableHeader>
                <TableHeader>STATUS</TableHeader>
                <TableHeader>RECIPIENT(S)</TableHeader>
                <TableHeader>SENDER</TableHeader>
                <TableHeader>COMPLETED DATE</TableHeader>
                <TableHeader>CREATE DATE</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {envelopes.map((envelope) => (
                <TableRow key={envelope.envelopeId}>
                  <TableCell>
                    <Box>
                      <Text format={{ fontWeight: "medium" }} style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                        {envelope.emailSubject}
                      </Text>
                      <Text variant="microcopy" format={{ color: 'medium' }} style={{ fontSize: '11px' }}>
                        ID: {envelope.envelopeId.substring(0, 8)}...
                      </Text>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={envelope.status}
                      color={envelope.displayData.statusColor}
                      label={envelope.displayData.statusLabel}
                    />
                  </TableCell>
                  <TableCell>
                    <RecipientsList 
                      recipientsDetails={envelope.recipientsDetails}
                      recipientsSummary={envelope.recipientsSummary || envelope.displayData.recipientsText}
                      maxDisplay={2}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Text format={{ fontWeight: "medium" }}>{envelope.displayData.senderDisplay}</Text>
                      {envelope.sender.email && (
                        <Text variant="microcopy" format={{ color: 'medium' }} style={{ fontSize: '11px' }}>
                          {envelope.sender.email}
                        </Text>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Text variant="microcopy" format={{ 
                      color: envelope.displayData.completedDate === 'Pending' ? 'warning' : 
                             envelope.displayData.completedDate === '—' ? 'medium' : 'default' 
                    }}>
                      {envelope.displayData.completedDate}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text variant="microcopy">{envelope.displayData.createDate}</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box marginTop="small">
            <Text variant="microcopy" format={{ color: 'medium' }}>
              Showing {envelopes.length} envelope{envelopes.length !== 1 ? 's' : ''} with detailed recipient information
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
};

export default EnvelopeTable;