// src/app/app.functions/listDocusignEnvelopes.js
// Enhanced DocuSign envelopes listing with detailed recipient information

const axios = require('axios');

exports.main = async (context) => {
  try {
    const {
      accessToken,
      baseUrl,
      accountId,
      page = 1,
      limit = 10,
      status = 'all',
      searchTerm = '',
      fromDate = null,
      toDate = null,
      orderBy = 'last_modified',
      order = 'desc'
    } = context.parameters;

    console.log('📋 Fetching DocuSign envelopes with parameters:', {
      page, limit, status, searchTerm, fromDate, toDate, orderBy, order
    });

    // Validate required parameters
    if (!accessToken || !baseUrl || !accountId) {
      throw new Error('Missing required authentication parameters. Please authenticate with DocuSign first.');
    }

    // Calculate pagination
    const startPosition = (page - 1) * limit;

    // Build query parameters
    const queryParams = new URLSearchParams({
      count: limit.toString(),
      start_position: startPosition.toString(),
      order_by: orderBy,
      order: order
    });

    // CRITICAL: Add include=recipients parameter to get recipient data
    queryParams.append('include', 'recipients');

    // DocuSign requires either from_date OR envelope_ids/folder_ids/transaction_ids
    // If no fromDate provided, set a default to get recent envelopes (last 30 days)
    let effectiveFromDate = fromDate;
    if (!effectiveFromDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      effectiveFromDate = thirtyDaysAgo.toISOString();
      console.log(`📅 No from_date provided, using default: ${effectiveFromDate}`);
    }

    // Add the required from_date parameter
    queryParams.append('from_date', effectiveFromDate);

    // Add status filter (if not 'all')
    if (status && status !== 'all') {
      queryParams.append('status', status);
    }

    // Add to_date if provided
    if (toDate) {
      queryParams.append('to_date', toDate);
    }

    // Add search term (if provided)
    if (searchTerm && searchTerm.trim()) {
      queryParams.append('search_text', searchTerm.trim());
    }

    // Construct API URL
    const apiUrl = `${baseUrl}/accounts/${accountId}/envelopes?${queryParams.toString()}`;
    
    console.log('🔗 DocuSign API URL:', apiUrl);
    console.log('✅ INCLUDING recipients data in API call');

    // Make API request with enhanced error handling
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      timeout: 30000, // 30 second timeout
      validateStatus: function (status) {
        return status < 500; // Resolve only if the status code is less than 500
      }
    });

    // Handle non-200 responses
    if (response.status !== 200) {
      console.error(`❌ DocuSign API returned status ${response.status}:`, response.data);
      
      if (response.status === 401) {
        return {
          status: "AUTH_ERROR",
          message: "DocuSign authentication expired. Please re-authenticate.",
          errorDetails: response.data,
          timestamp: Date.now()
        };
      } else if (response.status === 403) {
        return {
          status: "PERMISSION_ERROR", 
          message: "Insufficient permissions to access DocuSign envelopes.",
          errorDetails: response.data,
          timestamp: Date.now()
        };
      } else if (response.status === 429) {
        return {
          status: "RATE_LIMIT_ERROR",
          message: "DocuSign API rate limit exceeded. Please try again later.",
          errorDetails: response.data,
          timestamp: Date.now()
        };
      } else {
        throw new Error(`DocuSign API error: ${response.status} - ${response.statusText}`);
      }
    }

    const data = response.data;
    
    console.log(`📦 Retrieved ${data.envelopes?.length || 0} envelopes`);

    // Process envelope data with enhanced recipient handling
    const processedEnvelopes = (data.envelopes || []).map(envelope => {
      try {
        // Enhanced recipient processing with detailed information
        const recipientsData = getRecipientsDetails(envelope);
        const recipientsCount = recipientsData.count;
        const recipientsText = recipientsData.summary;
        
        // Debug log for recipients with detailed breakdown
        if (envelope.recipients) {
          console.log(`📝 Envelope ${envelope.envelopeId}: Found recipients data:`, {
            signers: envelope.recipients.signers?.length || 0,
            carbonCopies: envelope.recipients.carbonCopies?.length || 0,
            certifiedDeliveries: envelope.recipients.certifiedDeliveries?.length || 0,
            inPersonSigners: envelope.recipients.inPersonSigners?.length || 0,
            total: recipientsCount,
            summary: recipientsText,
            detailsCount: recipientsData.details.length
          });
        } else {
          console.log(`⚠️ Envelope ${envelope.envelopeId}: No recipients data found`);
        }

        return {
          // Basic envelope information
          envelopeId: envelope.envelopeId,
          emailSubject: envelope.emailSubject || 'No Subject',
          status: envelope.status,
          statusDateTime: envelope.statusChangedDateTime,
          
          // Sender information with safe access
          sender: envelope.sender ? {
            userName: envelope.sender.userName || 'Unknown',
            email: envelope.sender.email || ''
          } : {
            userName: 'Unknown Sender',
            email: ''
          },
          
          // Dates
          createdDateTime: envelope.createdDateTime,
          lastModifiedDateTime: envelope.lastModifiedDateTime,
          sentDateTime: envelope.sentDateTime,
          completedDateTime: envelope.completedDateTime,
          
          // Recipients data with detailed information
          recipientsCount: recipientsCount,
          recipients: envelope.recipients || {},
          recipientsDetails: recipientsData.details, // NEW: Detailed recipient info
          recipientsSummary: recipientsText, // NEW: Formatted summary
          
          // Additional metadata
          envelopeUri: envelope.envelopeUri,
          documentsCount: envelope.documentsCount || 0,
          
          // Custom fields (if any)
          customFields: envelope.customFields || {},
          
          // Template information (if used)
          templatesUri: envelope.templatesUri,
          
          // Formatted display data
          displayData: {
            statusColor: getStatusColor(envelope.status),
            statusLabel: getStatusLabel(envelope.status),
            recipientsText: recipientsText,
            lastUpdated: formatDate(envelope.lastModifiedDateTime),
            createDate: formatDate(envelope.createdDateTime),
            senderDisplay: envelope.sender?.userName || 'Unknown'
          }
        };
      } catch (processingError) {
        console.warn(`⚠️ Error processing envelope ${envelope.envelopeId}:`, processingError.message);
        // Return a minimal envelope object if processing fails
        return {
          envelopeId: envelope.envelopeId || 'unknown',
          emailSubject: 'Error processing envelope',
          status: envelope.status || 'unknown',
          statusDateTime: envelope.statusChangedDateTime,
          sender: { userName: 'Unknown', email: '' },
          createdDateTime: envelope.createdDateTime,
          lastModifiedDateTime: envelope.lastModifiedDateTime,
          recipientsCount: 0,
          recipients: {},
          recipientsDetails: [],
          recipientsSummary: 'Processing Error',
          displayData: {
            statusColor: '#95a5a6',
            statusLabel: 'Unknown',
            recipientsText: 'Processing Error',
            lastUpdated: formatDate(envelope.lastModifiedDateTime),
            createDate: formatDate(envelope.createdDateTime),
            senderDisplay: 'Unknown'
          }
        };
      }
    });

    // Calculate pagination metadata
    const totalCount = parseInt(data.totalSetSize) || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    console.log(`📊 Pagination: Page ${page}/${totalPages}, Total: ${totalCount}`);

    return {
      status: "SUCCESS",
      message: `Retrieved ${processedEnvelopes.length} envelopes with detailed recipient information`,
      data: {
        envelopes: processedEnvelopes,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPreviousPage,
          startPosition,
          endPosition: Math.min(startPosition + limit, totalCount)
        },
        filters: {
          status,
          searchTerm,
          fromDate: effectiveFromDate, // Return the actual date used
          toDate,
          orderBy,
          order
        },
        includeRecipients: true, // Flag indicating recipients are included
        recipientEnhancements: true // Flag indicating enhanced recipient processing
      },
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("❌ Error fetching DocuSign envelopes:", error);
    
    // Enhanced error handling
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      console.error(`❌ HTTP ${status} Error:`, errorData);
      
      if (status === 401) {
        return {
          status: "AUTH_ERROR",
          message: "DocuSign authentication expired. Please re-authenticate.",
          errorDetails: errorData,
          timestamp: Date.now()
        };
      } else if (status === 403) {
        return {
          status: "PERMISSION_ERROR",
          message: "Insufficient permissions to access DocuSign envelopes.",
          errorDetails: errorData,
          timestamp: Date.now()
        };
      } else if (status === 429) {
        return {
          status: "RATE_LIMIT_ERROR",
          message: "DocuSign API rate limit exceeded. Please try again later.",
          errorDetails: errorData,
          timestamp: Date.now()
        };
      } else if (status === 404) {
        return {
          status: "NOT_FOUND_ERROR",
          message: "DocuSign account or endpoint not found. Please check your configuration.",
          errorDetails: errorData,
          timestamp: Date.now()
        };
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        status: "NETWORK_ERROR",
        message: "Network error connecting to DocuSign. Please check your internet connection.",
        errorDetails: { code: error.code, message: error.message },
        timestamp: Date.now()
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        status: "TIMEOUT_ERROR",
        message: "Request to DocuSign timed out. Please try again.",
        errorDetails: { code: error.code, message: error.message },
        timestamp: Date.now()
      };
    }
    
    return {
      status: "ERROR",
      message: `Failed to fetch envelopes: ${error.message}`,
      errorDetails: {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      },
      timestamp: Date.now()
    };
  }
};

/**
 * Enhanced recipients count function with better error handling
 */
function getRecipientsCount(envelope) {
  if (!envelope || !envelope.recipients) {
    console.log('⚠️ No recipients object found in envelope');
    return 0;
  }
  
  let count = 0;
  const recipients = envelope.recipients;
  
  // Count all types of recipients
  if (recipients.signers && Array.isArray(recipients.signers)) {
    count += recipients.signers.length;
  }
  if (recipients.carbonCopies && Array.isArray(recipients.carbonCopies)) {
    count += recipients.carbonCopies.length;
  }
  if (recipients.certifiedDeliveries && Array.isArray(recipients.certifiedDeliveries)) {
    count += recipients.certifiedDeliveries.length;
  }
  if (recipients.inPersonSigners && Array.isArray(recipients.inPersonSigners)) {
    count += recipients.inPersonSigners.length;
  }
  if (recipients.intermediaries && Array.isArray(recipients.intermediaries)) {
    count += recipients.intermediaries.length;
  }
  if (recipients.witnesses && Array.isArray(recipients.witnesses)) {
    count += recipients.witnesses.length;
  }
  if (recipients.editors && Array.isArray(recipients.editors)) {
    count += recipients.editors.length;
  }
  
  return count;
}

/**
 * NEW: Get detailed recipient information with names, emails, and status
 */
function getRecipientsDetails(envelope) {
  if (!envelope || !envelope.recipients) {
    return {
      count: 0,
      details: [],
      summary: 'No recipients'
    };
  }
  
  const recipients = envelope.recipients;
  const details = [];
  
  // Process signers (most important)
  if (recipients.signers && Array.isArray(recipients.signers)) {
    recipients.signers.forEach((signer, index) => {
      details.push({
        type: 'signer',
        name: signer.name || signer.userName || 'Unknown Signer',
        email: signer.email || '',
        status: signer.status || 'created',
        routingOrder: signer.routingOrder || index + 1,
        recipientId: signer.recipientId,
        signedDateTime: signer.signedDateTime,
        deliveredDateTime: signer.deliveredDateTime,
        isPrimary: true
      });
    });
  }
  
  // Process carbon copies
  if (recipients.carbonCopies && Array.isArray(recipients.carbonCopies)) {
    recipients.carbonCopies.forEach((cc, index) => {
      details.push({
        type: 'cc',
        name: cc.name || cc.userName || 'Unknown CC',
        email: cc.email || '',
        status: cc.status || 'created',
        routingOrder: cc.routingOrder || 999,
        recipientId: cc.recipientId,
        deliveredDateTime: cc.deliveredDateTime,
        isPrimary: false
      });
    });
  }
  
  // Process certified deliveries
  if (recipients.certifiedDeliveries && Array.isArray(recipients.certifiedDeliveries)) {
    recipients.certifiedDeliveries.forEach((cert, index) => {
      details.push({
        type: 'certified',
        name: cert.name || cert.userName || 'Certified Recipient',
        email: cert.email || '',
        status: cert.status || 'created',
        routingOrder: cert.routingOrder || 999,
        recipientId: cert.recipientId,
        deliveredDateTime: cert.deliveredDateTime,
        isPrimary: false
      });
    });
  }
  
  // Sort by routing order, then by type priority
  details.sort((a, b) => {
    if (a.routingOrder !== b.routingOrder) {
      return a.routingOrder - b.routingOrder;
    }
    // Signers first, then CC, then others
    const typePriority = { signer: 1, cc: 2, certified: 3 };
    return (typePriority[a.type] || 999) - (typePriority[b.type] || 999);
  });
  
  return {
    count: details.length,
    details: details,
    summary: generateRecipientsSummary(details)
  };
}

/**
 * Generate a concise summary of recipients for display
 */
function generateRecipientsSummary(details) {
  if (!details || details.length === 0) {
    return 'No recipients';
  }
  
  // Get primary signers only for main display
  const signers = details.filter(r => r.type === 'signer');
  const others = details.filter(r => r.type !== 'signer');
  
  if (details.length === 1) {
    const recipient = details[0];
    const name = recipient.name || 'Unknown';
    const email = recipient.email ? ` (${recipient.email})` : '';
    return `${name}${email}`;
  }
  
  if (details.length === 2) {
    const names = details.map(r => r.name || 'Unknown').join(', ');
    return names;
  }
  
  if (details.length === 3) {
    const names = details.slice(0, 2).map(r => r.name || 'Unknown').join(', ');
    const third = details[2].name || 'Unknown';
    return `${names}, ${third}`;
  }
  
  // For 4+ recipients, show first name + count
  const firstName = details[0].name || 'Unknown';
  const remainingCount = details.length - 1;
  return `${firstName} +${remainingCount} other${remainingCount !== 1 ? 's' : ''}`;
}

/**
 * UPDATED: Enhanced recipients text function with names and emails
 */
function getRecipientsText(envelope) {
  const recipientDetails = getRecipientsDetails(envelope);
  return recipientDetails.summary;
}

/**
 * Get status color for UI display
 */
function getStatusColor(status) {
  const statusColors = {
    'sent': '#f39c12',          // Orange
    'delivered': '#3498db',     // Blue  
    'completed': '#27ae60',     // Green
    'declined': '#e74c3c',      // Red
    'voided': '#95a5a6',        // Gray
    'created': '#9b59b6',       // Purple
    'deleted': '#95a5a6',       // Gray
    'signed': '#27ae60',        // Green
    'corrected': '#f39c12'      // Orange
  };
  
  return statusColors[status?.toLowerCase()] || '#95a5a6';
}

/**
 * Get formatted status label
 */
function getStatusLabel(status) {
  if (!status) return 'Unknown';
  
  // Capitalize first letter
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/**
 * Format date with timezone
 */
function formatDate(dateString, userTimezone = 'America/Chicago') {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    // Format without timezone name first
    const formatted = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone
    }).format(date);
    
    // Always append CST regardless of daylight saving
    return `${formatted} CST`;
    
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateString;
  }
}