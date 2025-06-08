// src/app/extensions/components/StatusBadge.jsx
// Enhanced status badge with better visual design
import React from "react";
import { Text, Box } from "@hubspot/ui-extensions";

const StatusBadge = ({ status, color, label }) => {
  const getStatusIcon = (status) => {
    const icons = {
      'sent': '📤', 
      'delivered': '📬', 
      'completed': '✅', 
      'declined': '❌',
      'voided': '🚫', 
      'created': '📝', 
      'deleted': '🗑️', 
      'signed': '✅', 
      'corrected': '🔄'
    };
    return icons[status?.toLowerCase()] || '📋';
  };

  const getBackgroundColor = (color) => {
    const colorMap = {
      '#27ae60': '#e8f5e8', // Green - Completed
      '#f39c12': '#fef5e7', // Orange - Sent/Pending  
      '#3498db': '#e8f4f8', // Blue - Delivered
      '#e74c3c': '#fbeaea', // Red - Declined/Error
      '#95a5a6': '#f4f4f4', // Gray - Voided/Inactive
      '#9b59b6': '#f0eaf4'  // Purple - Created
    };
    return colorMap[color] || '#f4f4f4';
  };

  const getBorderColor = (color) => {
    // Use a slightly darker shade for border
    const borderMap = {
      '#27ae60': '#27ae60',
      '#f39c12': '#f39c12', 
      '#3498db': '#3498db',
      '#e74c3c': '#e74c3c',
      '#95a5a6': '#95a5a6',
      '#9b59b6': '#9b59b6'
    };
    return borderMap[color] || '#95a5a6';
  };

  return (
    <Box style={{
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px', 
      padding: '4px 8px',
      borderRadius: '12px', 
      backgroundColor: getBackgroundColor(color),
      border: `1px solid ${getBorderColor(color)}`, 
      maxWidth: 'fit-content',
      minWidth: 'fit-content'
    }}>
      <Text style={{ fontSize: '12px' }}>
        {getStatusIcon(status)}
      </Text>
      <Text variant="microcopy" style={{ 
        color: color, 
        fontWeight: '500', 
        fontSize: '12px',
        whiteSpace: 'nowrap'
      }}>
        {label || status}
      </Text>
    </Box>
  );
};

export default StatusBadge;