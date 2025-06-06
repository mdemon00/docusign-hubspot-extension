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
