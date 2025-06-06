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
