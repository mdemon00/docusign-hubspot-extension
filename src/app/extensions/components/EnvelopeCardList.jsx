// src/app/extensions/components/EnvelopeCardList.jsx
// Table-based envelope display for better data viewing
import React from "react";
import {
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Text, Flex, Box, LoadingSpinner, Alert, Button, Tile
} from "@hubspot/ui-extensions";

import StatusBadge from './StatusBadge.jsx';
import SimplePagination from './SimplePagination.jsx';

const EmptyState = ({ onRefresh }) => (
  <Box padding="large" style={{ textAlign: 'center' }}>
    <Text style={{ fontSize: '48px' }} marginBottom="small">📭</Text>
    <Text format={{ fontWeight: "bold" }} marginBottom="small">
      No envelopes found
    </Text>
    <Text variant="microcopy" format={{ color: "medium" }} marginBottom="medium">
      Try adjusting your filters or check back later
    </Text>
    <Button variant="secondary" size="xs" onClick={onRefresh}>
      🔄 Refresh
    </Button>
  </Box>
);

const LoadingState = () => (
  <Box padding="large" style={{ textAlign: 'center' }}>
    <LoadingSpinner label="Loading envelopes..." />
  </Box>
);

const ErrorState = ({ error, onRefresh }) => (
  <Alert variant="error">
    <Flex justify="space-between" align="center">
      <Box>
        <Text format={{ fontWeight: "bold" }}>❌ Error Loading Envelopes</Text>
        <Text variant="microcopy" marginTop="xs">{error}</Text>
      </Box>
      <Button variant="secondary" size="xs" onClick={onRefresh}>
        🔄 Retry
      </Button>
    </Flex>
  </Alert>
);

const EnvelopeTable = ({ 
  envelopes, 
  loading, 
  error, 
  pagination,
  onRefresh, 
  onPageChange 
}) => {
  // Loading state
  if (loading) {
    return (
      <Tile>
        <LoadingState />
      </Tile>
    );
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRefresh={onRefresh} />;
  }

  // Empty state
  if (!envelopes?.length) {
    return (
      <Tile>
        <EmptyState onRefresh={onRefresh} />
      </Tile>
    );
  }

  return (
    <Box marginBottom="large">
      {/* Header */}
      <Flex justify="space-between" align="center" marginBottom="medium">
        <Text format={{ fontWeight: "bold" }}>
          📋 Recent Envelopes ({pagination.totalCount || envelopes.length})
        </Text>
        <Button variant="secondary" size="xs" onClick={onRefresh}>
          🔄 Refresh
        </Button>
      </Flex>

      {/* Table */}
      <Tile>
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
                  <Text variant="microcopy">{envelope.displayData.recipientsText}</Text>
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
            Showing {envelopes.length} envelope{envelopes.length !== 1 ? 's' : ''}
          </Text>
        </Box>
      </Tile>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box marginTop="medium">
          <SimplePagination 
            pagination={pagination}
            onPageChange={onPageChange}
            disabled={loading}
          />
        </Box>
      )}
    </Box>
  );
};

export default EnvelopeTable;