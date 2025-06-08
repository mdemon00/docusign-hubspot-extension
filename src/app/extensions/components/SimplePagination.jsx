// src/app/extensions/components/SimplePagination.jsx
import React from "react";
import { Button, Text, Flex, Box } from "@hubspot/ui-extensions";

const SimplePagination = ({ pagination, onPageChange, disabled = false }) => {
  const { currentPage, totalPages, totalCount, hasNextPage, hasPreviousPage } = pagination;

  if (totalPages <= 1) return null;

  return (
    <Box>
      <Flex justify="space-between" align="center">
        <Text variant="microcopy" format={{ color: 'medium' }}>
          Page {currentPage} of {totalPages} • {totalCount} total
        </Text>

        <Flex gap="small" align="center">
          <Button 
            variant="secondary" 
            size="xs"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled || !hasPreviousPage}
          >
            ◀️ Previous
          </Button>
          
          <Text variant="microcopy">
            {currentPage} / {totalPages}
          </Text>
          
          <Button 
            variant="secondary" 
            size="xs"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={disabled || !hasNextPage}
          >
            Next ▶️
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default SimplePagination;