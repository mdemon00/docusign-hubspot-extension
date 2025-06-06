export const DOCUSIGN_CONSTANTS = {
  STATUS_OPTIONS: [
    { label: "All Statuses", value: "all" },
    { label: "Created", value: "created" },
    { label: "Sent", value: "sent" },
    { label: "Delivered", value: "delivered" },
    { label: "Signed", value: "signed" },
    { label: "Completed", value: "completed" },
    { label: "Declined", value: "declined" },
    { label: "Voided", value: "voided" }
  ],

  SORT_OPTIONS: [
    { label: "Last Modified", value: "last_modified" },
    { label: "Created Date", value: "created" },
    { label: "Sent Date", value: "sent" },
    { label: "Subject", value: "subject" }
  ],

  ORDER_OPTIONS: [
    { label: "Newest first", value: "desc" },
    { label: "Oldest first", value: "asc" }
  ],

  STATUS_COLORS: {
    'sent': '#f39c12', 'delivered': '#3498db', 'completed': '#27ae60',
    'declined': '#e74c3c', 'voided': '#95a5a6', 'created': '#9b59b6',
    'signed': '#27ae60', 'corrected': '#f39c12'
  },

  ERROR_MESSAGES: {
    AUTH_REQUIRED: 'DocuSign authentication is required',
    AUTH_EXPIRED: 'DocuSign session has expired',
    PERMISSION_DENIED: 'Permission denied to access DocuSign account',
    RATE_LIMIT: 'DocuSign API rate limit exceeded',
    NO_ENVELOPES: 'No envelopes found'
  },

  PAGINATION: { DEFAULT_LIMIT: 10, MAX_LIMIT: 100 },
  
  TIMING: { SEARCH_DEBOUNCE: 500, ALERT_TIMEOUT: 4000 }
};

export const DOCUSIGN_HELPERS = {
  getStatusColor: (status) => DOCUSIGN_CONSTANTS.STATUS_COLORS[status?.toLowerCase()] || '#95a5a6',
  
  formatStatusLabel: (status) => status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown',
  
  formatDate: (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateString; }
  }
};
