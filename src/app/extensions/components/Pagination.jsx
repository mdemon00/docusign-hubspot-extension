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
