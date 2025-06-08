
// src/app/extensions/components/AdvancedFilters.jsx
import React, { useState } from "react";
import { Box, Text, Flex, Button, Input, Select, DateInput } from "@hubspot/ui-extensions";

const AdvancedFilters = ({ filters, onFilterChange, disabled }) => {
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

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
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
    <Box marginTop="medium" padding="medium" style={{ 
      backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e1e5e9' 
    }}>
      <Flex justify="space-between" align="center" marginBottom="small">
        <Text format={{ fontWeight: "bold" }}>🔍 Advanced Filters</Text>
        {hasActiveFilters() && (
          <Button variant="transparent" size="xs" onClick={handleClearFilters} disabled={disabled}>
            ✕ Clear All
          </Button>
        )}
      </Flex>
      
      <Flex gap="medium" wrap="wrap">
        <Box style={{ minWidth: '250px', flex: 2 }}>
          <Text variant="microcopy" marginBottom="xs">Search</Text>
          <Input
            name="searchTerm"
            placeholder="Search by subject, recipient, or ID..."
            value={localFilters.searchTerm}
            onChange={(value) => handleFilterChange('searchTerm', value)}
            disabled={disabled}
          />
        </Box>
        
        <Box style={{ minWidth: '150px', flex: 1 }}>
          <Text variant="microcopy" marginBottom="xs">Status</Text>
          <Select
            name="status"
            options={statusOptions}
            value={localFilters.status}
            onChange={(value) => handleFilterChange('status', value)}
            disabled={disabled}
          />
        </Box>
        
        <Box style={{ minWidth: '150px', flex: 1 }}>
          <Text variant="microcopy" marginBottom="xs">From Date</Text>
          <DateInput
            name="fromDate"
            value={localFilters.fromDate}
            onChange={(value) => handleFilterChange('fromDate', value)}
            disabled={disabled}
          />
        </Box>
        
        <Box style={{ minWidth: '150px', flex: 1 }}>
          <Text variant="microcopy" marginBottom="xs">To Date</Text>
          <DateInput
            name="toDate"
            value={localFilters.toDate}
            onChange={(value) => handleFilterChange('toDate', value)}
            disabled={disabled}
          />
        </Box>
        
        <Box style={{ minWidth: '150px', flex: 1 }}>
          <Text variant="microcopy" marginBottom="xs">Sort By</Text>
          <Select
            name="orderBy"
            options={sortOptions}
            value={localFilters.orderBy}
            onChange={(value) => handleFilterChange('orderBy', value)}
            disabled={disabled}
          />
        </Box>
        
        <Box style={{ minWidth: '120px', flex: 1 }}>
          <Text variant="microcopy" marginBottom="xs">Order</Text>
          <Select
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
  );
};

export default AdvancedFilters;
