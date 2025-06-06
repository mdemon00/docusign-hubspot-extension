#!/bin/bash
# Create all component files for DocuSign Integration

echo "Creating component files..."

# Create components directory
mkdir -p src/app/extensions/components
mkdir -p src/app/extensions/utils

# Create EnvelopeTable component
cat > src/app/extensions/components/EnvelopeTable.jsx << 'EOF'
import React from "react";
import {
  Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  Text, Flex, Box, LoadingSpinner, Alert, Button
} from "@hubspot/ui-extensions";

import StatusBadge from './StatusBadge.jsx';

const EnvelopeTable = ({ envelopes, loading, error, onRefresh }) => {
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

  if (!envelopes?.length) {
    return (
      <Box padding="large" style={{ textAlign: 'center' }}>
        <Text variant="microcopy" format={{ color: 'medium' }}>📭 No envelopes found</Text>
        <Box marginTop="small">
          <Button variant="secondary" size="xs" onClick={onRefresh}>🔄 Refresh</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" marginBottom="small">
        <Text format={{ fontWeight: "bold" }}>
          📋 {envelopes.length} envelope{envelopes.length !== 1 ? 's' : ''}
        </Text>
        <Button variant="secondary" size="xs" onClick={onRefresh}>🔄 Refresh</Button>
      </Flex>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>NAME</TableHeader>
            <TableHeader>STATUS</TableHeader>
            <TableHeader>RECIPIENT(S)</TableHeader>
            <TableHeader>SENDER</TableHeader>
            <TableHeader>LAST UPDATED</TableHeader>
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
                <Text variant="microcopy">{envelope.displayData.lastUpdated}</Text>
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
    </Box>
  );
};

export default EnvelopeTable;
EOF

# Create StatusBadge component
cat > src/app/extensions/components/StatusBadge.jsx << 'EOF'
import React from "react";
import { Text, Box } from "@hubspot/ui-extensions";

const StatusBadge = ({ status, color, label }) => {
  const getStatusIcon = (status) => {
    const icons = {
      'sent': '📤', 'delivered': '📬', 'completed': '✅', 'declined': '❌',
      'voided': '🚫', 'created': '📝', 'deleted': '🗑️', 'signed': '✅', 'corrected': '🔄'
    };
    return icons[status?.toLowerCase()] || '📋';
  };

  const getBackgroundColor = (color) => {
    const colorMap = {
      '#27ae60': '#e8f5e8', '#f39c12': '#fef5e7', '#3498db': '#e8f4f8',
      '#e74c3c': '#fbeaea', '#95a5a6': '#f4f4f4', '#9b59b6': '#f0eaf4'
    };
    return colorMap[color] || '#f4f4f4';
  };

  return (
    <Box style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
      borderRadius: '12px', backgroundColor: getBackgroundColor(color),
      border: `1px solid ${color}`, maxWidth: 'fit-content'
    }}>
      <Text style={{ fontSize: '12px' }}>{getStatusIcon(status)}</Text>
      <Text variant="microcopy" style={{ color: color, fontWeight: '500', fontSize: '12px' }}>
        {label || status}
      </Text>
    </Box>
  );
};

export default StatusBadge;
EOF

# Create SearchFilter component
cat > src/app/extensions/components/SearchFilter.jsx << 'EOF'
import React, { useState, useCallback } from "react";
import {
  Input, Select, DateInput, Button, Flex, Box, Text, Tile
} from "@hubspot/ui-extensions";

const SearchFilter = ({ filters, onFilterChange, disabled = false }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Created", value: "created" },
    { label: "Sent", value: "sent" },
    { label: "Delivered", value: "delivered" },
    { label: "Signed", value: "signed" },
    { label: "Completed", value: "completed" },
    { label: "Declined", value: "declined" },
    { label: "Voided", value: "voided" }
  ];

  const sortOptions = [
    { label: "Last Modified", value: "last_modified" },
    { label: "Created Date", value: "created" },
    { label: "Sent Date", value: "sent" },
    { label: "Subject", value: "subject" }
  ];

  const orderOptions = [
    { label: "Newest first", value: "desc" },
    { label: "Oldest first", value: "asc" }
  ];

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((searchTerm) => onFilterChange({ searchTerm }), 500),
    [onFilterChange]
  );

  const handleSearchChange = (value) => {
    setLocalFilters(prev => ({ ...prev, searchTerm: value }));
    debouncedSearch(value);
  };

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
    onFilterChange({ [field]: value });
  };

  const handleClearFilters = () => {
    const cleared = {
      status: 'all', searchTerm: '', fromDate: null, toDate: null,
      orderBy: 'last_modified', order: 'desc'
    };
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = () => {
    return localFilters.status !== 'all' || localFilters.searchTerm !== '' || 
           localFilters.fromDate || localFilters.toDate;
  };

  return (
    <Tile>
      <Flex justify="space-between" align="center" marginBottom="medium">
        <Text format={{ fontWeight: "bold" }}>🔍 Search & Filter</Text>
        {hasActiveFilters() && (
          <Button variant="secondary" size="xs" onClick={handleClearFilters} disabled={disabled}>
            ✕ Clear Filters
          </Button>
        )}
      </Flex>

      <Box>
        <Flex direction="row" gap="medium" wrap="wrap" marginBottom="medium">
          <Box flex={2} minWidth="250px">
            <Input
              label="Search Envelopes"
              name="searchTerm"
              placeholder="Search by subject, recipient, or envelope ID..."
              value={localFilters.searchTerm}
              onChange={handleSearchChange}
              disabled={disabled}
            />
          </Box>
          <Box flex={1} minWidth="150px">
            <Select
              label="Status"
              name="status"
              options={statusOptions}
              value={localFilters.status}
              onChange={(value) => handleFilterChange('status', value)}
              disabled={disabled}
            />
          </Box>
        </Flex>

        <Flex direction="row" gap="medium" wrap="wrap">
          <Box flex={1} minWidth="150px">
            <DateInput
              label="From Date"
              name="fromDate"
              value={localFilters.fromDate}
              onChange={(value) => handleFilterChange('fromDate', value)}
              disabled={disabled}
            />
          </Box>
          <Box flex={1} minWidth="150px">
            <DateInput
              label="To Date"
              name="toDate"
              value={localFilters.toDate}
              onChange={(value) => handleFilterChange('toDate', value)}
              disabled={disabled}
            />
          </Box>
          <Box flex={1} minWidth="150px">
            <Select
              label="Sort By"
              name="orderBy"
              options={sortOptions}
              value={localFilters.orderBy}
              onChange={(value) => handleFilterChange('orderBy', value)}
              disabled={disabled}
            />
          </Box>
          <Box flex={1} minWidth="120px">
            <Select
              label="Order"
              name="order"
              options={orderOptions}
              value={localFilters.order}
              onChange={(value) => handleFilterChange('order', value)}
              disabled={disabled}
            />
          </Box>
        </Flex>

        {hasActiveFilters() && (
          <Box marginTop="small">
            <Text variant="microcopy" format={{ color: 'medium' }}>
              Active filters: {[
                localFilters.status !== 'all' && `Status: ${localFilters.status}`,
                localFilters.searchTerm && `Search: "${localFilters.searchTerm}"`,
                localFilters.fromDate && `From: ${localFilters.fromDate}`,
                localFilters.toDate && `To: ${localFilters.toDate}`
              ].filter(Boolean).join(', ')}
            </Text>
          </Box>
        )}
      </Box>
    </Tile>
  );
};

export default SearchFilter;
EOF

# Create Pagination component
cat > src/app/extensions/components/Pagination.jsx << 'EOF'
import React from "react";
import { Button, Text, Flex, Box, Select } from "@hubspot/ui-extensions";

const Pagination = ({ pagination, onPageChange, disabled = false }) => {
  const { currentPage, totalPages, totalCount, hasNextPage, hasPreviousPage, startPosition, endPosition } = pagination;

  const handlePageChange = (page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
      onPageChange(pageNum);
    }
  };

  const getPageOptions = () => {
    const options = [];
    for (let i = 1; i <= totalPages; i++) {
      options.push({ label: `Page ${i}`, value: i.toString() });
    }
    return options;
  };

  if (totalPages <= 1) return null;

  return (
    <Box>
      <Flex justify="space-between" align="center" wrap="wrap" gap="medium">
        <Box>
          <Text variant="microcopy" format={{ color: 'medium' }}>
            Showing {startPosition + 1}-{endPosition} of {totalCount} envelopes
          </Text>
        </Box>

        <Flex align="center" gap="small" wrap="wrap">
          <Flex gap="extra-small">
            <Button variant="secondary" size="xs" 
                    onClick={() => onPageChange(1)}
                    disabled={disabled || !hasPreviousPage} title="First page">
              ⏮️
            </Button>
            <Button variant="secondary" size="xs"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={disabled || !hasPreviousPage} title="Previous page">
              ◀️
            </Button>
          </Flex>

          <Flex align="center" gap="extra-small">
            <Text variant="microcopy">Page</Text>
            <Box style={{ minWidth: '80px' }}>
              <Select name="currentPage" options={getPageOptions()} value={currentPage.toString()}
                      onChange={handlePageChange} disabled={disabled} size="xs" />
            </Box>
            <Text variant="microcopy">of {totalPages}</Text>
          </Flex>

          <Flex gap="extra-small">
            <Button variant="secondary" size="xs"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={disabled || !hasNextPage} title="Next page">
              ▶️
            </Button>
            <Button variant="secondary" size="xs"
                    onClick={() => onPageChange(totalPages)}
                    disabled={disabled || !hasNextPage} title="Last page">
              ⏭️
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <Box marginTop="small">
        <Text variant="microcopy" format={{ color: 'medium' }}>
          Page {currentPage} of {totalPages} • {totalCount} total envelope{totalCount !== 1 ? 's' : ''}
        </Text>
      </Box>
    </Box>
  );
};

export default Pagination;
EOF

# Create utils constants file
cat > src/app/extensions/utils/docusignConstants.js << 'EOF'
export const DOCUSIGN_CONSTANTS = {
  STATUS_OPTIONS: [
    { label: "All Statuses", value: "all" },
    { label: "Created", value: "created" },
    { label: "Sent", value: "sent" },
    { label: "Delivered", value: "delivered" },
    { label: "Signed", value: "signed" },
    { label: "Completed", value: "completed" },
    { label: "Declined", value: "declined" },
    { label: "Voided", value: "voided" }
  ],

  SORT_OPTIONS: [
    { label: "Last Modified", value: "last_modified" },
    { label: "Created Date", value: "created" },
    { label: "Sent Date", value: "sent" },
    { label: "Subject", value: "subject" }
  ],

  ORDER_OPTIONS: [
    { label: "Newest first", value: "desc" },
    { label: "Oldest first", value: "asc" }
  ],

  STATUS_COLORS: {
    'sent': '#f39c12', 'delivered': '#3498db', 'completed': '#27ae60',
    'declined': '#e74c3c', 'voided': '#95a5a6', 'created': '#9b59b6',
    'signed': '#27ae60', 'corrected': '#f39c12'
  },

  ERROR_MESSAGES: {
    AUTH_REQUIRED: 'DocuSign authentication is required',
    AUTH_EXPIRED: 'DocuSign session has expired',
    PERMISSION_DENIED: 'Permission denied to access DocuSign account',
    RATE_LIMIT: 'DocuSign API rate limit exceeded',
    NO_ENVELOPES: 'No envelopes found'
  },

  PAGINATION: { DEFAULT_LIMIT: 10, MAX_LIMIT: 100 },
  
  TIMING: { SEARCH_DEBOUNCE: 500, ALERT_TIMEOUT: 4000 }
};

export const DOCUSIGN_HELPERS = {
  getStatusColor: (status) => DOCUSIGN_CONSTANTS.STATUS_COLORS[status?.toLowerCase()] || '#95a5a6',
  
  formatStatusLabel: (status) => status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown',
  
  formatDate: (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  }
};
EOF

echo "✅ All component files created successfully!"
echo ""
echo "Files created:"
echo "  📁 src/app/extensions/components/EnvelopeTable.jsx"
echo "  📁 src/app/extensions/components/StatusBadge.jsx" 
echo "  📁 src/app/extensions/components/SearchFilter.jsx"
echo "  📁 src/app/extensions/components/Pagination.jsx"
echo "  📁 src/app/extensions/utils/docusignConstants.js"
echo ""
echo "Your DocuSign HubSpot Extension is ready to deploy!"