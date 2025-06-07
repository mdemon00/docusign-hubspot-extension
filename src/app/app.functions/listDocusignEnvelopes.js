// src/app/app.functions/listDocusignEnvelopes.js
// Enhanced DocuSign envelopes listing with better error handling

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

    // Add status filter (if not 'all')
    if (status && status !== 'all') {
      queryParams.append('status', status);
    }

    // Add date range filters
    if (fromDate) {
      queryParams.append('from_date', fromDate);
    }
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

    // Process envelope data with enhanced error handling
    const processedEnvelopes = (data.envelopes || []).map(envelope => {
      try {
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
          
          // Recipients count
          recipientsCount: getRecipientsCount(envelope),
          
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
            recipientsText: getRecipientsText(envelope),
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
          displayData: {
            statusColor: '#95a5a6',
            statusLabel: 'Unknown',
            recipientsText: 'Unknown',
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
      message: `Retrieved ${processedEnvelopes.length} envelopes`,
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
          fromDate,
          toDate,
          orderBy,
          order
        }
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
 * Get recipients count from envelope data
 */
function getRecipientsCount(envelope) {
  if (!envelope.recipients) return 0;
  
  let count = 0;
  if (envelope.recipients.signers) count += envelope.recipients.signers.length;
  if (envelope.recipients.carbonCopies) count += envelope.recipients.carbonCopies.length;
  if (envelope.recipients.certifiedDeliveries) count += envelope.recipients.certifiedDeliveries.length;
  if (envelope.recipients.inPersonSigners) count += envelope.recipients.inPersonSigners.length;
  
  return count;
}

/**
 * Get recipients text for display
 */
function getRecipientsText(envelope) {
  const count = getRecipientsCount(envelope);
  if (count === 0) return 'No recipients';
  if (count === 1) return '1 recipient';
  return `${count} recipients`;
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
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}