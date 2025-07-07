// src/app/extensions/components/QuickFilters.jsx
import React from "react";
import { Button, Flex } from "@hubspot/ui-extensions";

const QuickFilters = ({ selectedView, onFilterChange, sentEnvelopes, completedEnvelopes }) => {
  // Calculate counts for each filter from separate data sets
  const getCounts = () => {
    const sent = sentEnvelopes?.length || 0;
    const completed = completedEnvelopes?.length || 0;
    
    return {
      sent: sent,
      completed: completed
    };
  };

  const counts = getCounts();

  const quickFilters = [
    { label: "Sent", value: "sent", count: counts.sent },
    { label: "Completed", value: "completed", count: counts.completed }
  ];

  return (
    <Flex gap="small" wrap="wrap" marginBottom="medium">
      {quickFilters.map(filter => (
        <Button
          key={filter.value}
          variant={selectedView === filter.value ? "primary" : "secondary"}
          size="xs"
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label} ({filter.count})
        </Button>
      ))}
    </Flex>
  );
};

export default QuickFilters;