// src/app/extensions/components/RecipientsList.jsx
// Enhanced component to display DocuSign envelope recipients with names, emails, and status
import React, { useState } from "react";
import { Text, Box, Button, Flex } from "@hubspot/ui-extensions";

const RecipientsList = ({ 
  recipientsDetails = [], 
  recipientsSummary = "No recipients",
  maxDisplay = 2 // Maximum number of recipients to show without expansion
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no detailed recipient data, show summary
  if (!recipientsDetails || recipientsDetails.length === 0) {
    return (
      <Text variant="microcopy" format={{ color: "medium" }}>
        {recipientsSummary}
      </Text>
    );
  }

  const getStatusIcon = (status) => {
    const icons = {
      'completed': '✅',
      'signed': '✅', 
      'delivered': '📬',
      'sent': '📤',
      'created': '⏳',
      'declined': '❌',
      'autoresponded': '🤖'
    };
    return icons[status?.toLowerCase()] || '⏳';
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': '#27ae60',
      'signed': '#27ae60',
      'delivered': '#3498db', 
      'sent': '#f39c12',
      'created': '#95a5a6',
      'declined': '#e74c3c',
      'autoresponded': '#9b59b6'
    };
    return colors[status?.toLowerCase()] || '#95a5a6';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'signer': 'Signer',
      'cc': 'CC',
      'certified': 'Certified'
    };
    return labels[type] || type;
  };

  // For single recipient, show full details
  if (recipientsDetails.length === 1) {
    const recipient = recipientsDetails[0];
    return (
      <Box>
        <Flex align="center" gap="xs" marginBottom="xs">
          <Text style={{ fontSize: '12px' }}>
            {getStatusIcon(recipient.status)}
          </Text>
          <Text variant="microcopy" format={{ fontWeight: "medium" }}>
            {recipient.name}
          </Text>
          {recipient.type !== 'signer' && (
            <Text variant="microcopy" format={{ color: "medium" }} style={{ fontSize: '10px' }}>
              ({getTypeLabel(recipient.type)})
            </Text>
          )}
        </Flex>
        {recipient.email && (
          <Text variant="microcopy" format={{ color: "medium" }} style={{ fontSize: '11px' }}>
            {recipient.email}
          </Text>
        )}
      </Box>
    );
  }

  // For 2-3 recipients, show compact list
  if (recipientsDetails.length <= 3 && !isExpanded) {
    return (
      <Box>
        {recipientsDetails.slice(0, maxDisplay).map((recipient, index) => (
          <Flex key={recipient.recipientId || index} align="center" gap="xs" marginBottom="xs">
            <Text style={{ fontSize: '11px' }}>
              {getStatusIcon(recipient.status)}
            </Text>
            <Text variant="microcopy" format={{ fontWeight: "medium" }} style={{ fontSize: '12px' }}>
              {recipient.name}
            </Text>
            {recipient.type !== 'signer' && (
              <Text variant="microcopy" format={{ color: "medium" }} style={{ fontSize: '10px' }}>
                ({getTypeLabel(recipient.type)})
              </Text>
            )}
          </Flex>
        ))}
        
        {recipientsDetails.length > maxDisplay && (
          <Button 
            variant="transparent" 
            size="xs" 
            onClick={() => setIsExpanded(true)}
            style={{ padding: '2px 0', fontSize: '11px' }}
          >
            +{recipientsDetails.length - maxDisplay} more
          </Button>
        )}
      </Box>
    );
  }

  // For 4+ recipients or expanded view, show detailed list
  if (recipientsDetails.length > 3 || isExpanded) {
    const displayRecipients = isExpanded ? recipientsDetails : recipientsDetails.slice(0, 1);
    
    return (
      <Box>
        {!isExpanded ? (
          // Collapsed view - show summary
          <Flex direction="column" gap="xs">
            <Flex align="center" gap="xs">
              <Text style={{ fontSize: '11px' }}>
                {getStatusIcon(recipientsDetails[0].status)}
              </Text>
              <Text variant="microcopy" format={{ fontWeight: "medium" }} style={{ fontSize: '12px' }}>
                {recipientsDetails[0].name}
              </Text>
            </Flex>
            <Button 
              variant="transparent" 
              size="xs" 
              onClick={() => setIsExpanded(true)}
              style={{ padding: '2px 0', fontSize: '11px', alignSelf: 'flex-start' }}
            >
              +{recipientsDetails.length - 1} other{recipientsDetails.length - 1 !== 1 ? 's' : ''}
            </Button>
          </Flex>
        ) : (
          // Expanded view - show all recipients
          <Box>
            <Flex justify="space-between" align="center" marginBottom="small">
              <Text variant="microcopy" format={{ fontWeight: "bold" }} style={{ fontSize: '12px' }}>
                All Recipients ({recipientsDetails.length})
              </Text>
              <Button 
                variant="transparent" 
                size="xs" 
                onClick={() => setIsExpanded(false)}
                style={{ padding: '2px 4px', fontSize: '10px' }}
              >
                ✕
              </Button>
            </Flex>
            
            {recipientsDetails.map((recipient, index) => (
              <Box 
                key={recipient.recipientId || index} 
                marginBottom="xs"
                style={{ 
                  padding: '4px 6px', 
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'transparent',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}
              >
                <Flex align="center" gap="xs" marginBottom="xs">
                  <Text style={{ fontSize: '11px' }}>
                    {getStatusIcon(recipient.status)}
                  </Text>
                  <Text variant="microcopy" format={{ fontWeight: "medium" }} style={{ fontSize: '11px' }}>
                    {recipient.name}
                  </Text>
                  <Text 
                    variant="microcopy" 
                    style={{ 
                      fontSize: '10px',
                      color: getStatusColor(recipient.status),
                      fontWeight: '500'
                    }}
                  >
                    {recipient.status}
                  </Text>
                  {recipient.type !== 'signer' && (
                    <Text variant="microcopy" format={{ color: "medium" }} style={{ fontSize: '9px' }}>
                      ({getTypeLabel(recipient.type)})
                    </Text>
                  )}
                </Flex>
                {recipient.email && (
                  <Text variant="microcopy" format={{ color: "medium" }} style={{ fontSize: '10px' }}>
                    {recipient.email}
                  </Text>
                )}
                {recipient.signedDateTime && (
                  <Text variant="microcopy" format={{ color: "medium" }} style={{ fontSize: '9px' }}>
                    Signed: {new Date(recipient.signedDateTime).toLocaleDateString()}
                  </Text>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Fallback
  return (
    <Text variant="microcopy">
      {recipientsSummary}
    </Text>
  );
};

export default RecipientsList;