// src/app/extensions/components/QuickFilters.jsx
import React from "react";
import { Button, Flex } from "@hubspot/ui-extensions";

const QuickFilters = ({ selectedView, onFilterChange, envelopes }) => {
  // Calculate counts for each filter
  const getCounts = () => {
    const total = envelopes?.length || 0;
    const sent = envelopes?.filter(e => e.status === 'sent')?.length || 0;
    const completed = envelopes?.filter(e => e.status === 'completed')?.length || 0;
    
    return {
      recent: total,
      sent: sent,
      completed: completed,
      all: total
    };
  };

  const counts = getCounts();

  const quickFilters = [
    { label: "Recent", value: "recent", count: counts.recent },
    { label: "Sent", value: "sent", count: counts.sent },
    { label: "Completed", value: "completed", count: counts.completed },
    { label: "All", value: "all", count: counts.all }
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