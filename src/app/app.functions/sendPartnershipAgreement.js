// src/app/app.functions/sendPartnershipAgreement.js
// Fixed version without window usage - Compatible with HubSpot UI Extensions

const hubspot = require('@hubspot/api-client');
const crypto = require('crypto');
const axios = require('axios');

exports.main = async (context) => {
  const logs = [];
  logs.push('Starting Partnership Agreement send process - v1.2.0');

  try {
    const { companyId } = context.parameters;
    
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    logs.push(`Processing company ID: ${companyId}`);

    // Initialize HubSpot client
    const hubspotClient = new hubspot.Client({
      accessToken: process.env.PRIVATE_APP_ACCESS_TOKEN
    });

    const portalId = '20424362';
    let companyName = "Unknown Company";
    let webhookPayload = {};

    try {
      // PHASE 1: COMPANY VALIDATION
      const requiredProperties = [
        'hubspot_owner_id',
        'partnership_size', 
        'partnership_level',
        'corporate_account',
        'business_type',
        'roster_uploaded_date',
        'hierarchy',
        'notification_team_contacts',
        'partnership_agreement_signer'
      ];

      // Fetch company data
      const companyResponse = await hubspotClient.crm.companies.basicApi.getById(
        companyId,
        [...requiredProperties, 'name']
      );

      companyName = companyResponse.properties.name || 'Unknown Company';
      logs.push(`Company name: ${companyName}`);

      // Parse team contact IDs from company property
      const teamContactsProperty = companyResponse.properties.notification_team_contacts || '';
      let teamContactIds = [];
      
      if (teamContactsProperty.trim()) {
        teamContactIds = teamContactsProperty
          .split('\n')
          .map(id => id.trim())
          .filter(id => id.length > 0);
        logs.push(`Found ${teamContactIds.length} team contacts in company property`);
      } else {
        logs.push('No team contacts found in company property. Using default fallback contacts.');
        teamContactIds = ['116135349037'];
      }

      // Validate properties with conditional logic
      const properties = companyResponse.properties || {};
      const missingProperties = [];
      const hierarchy = properties.hierarchy || '';
      logs.push(`Hierarchy value: ${hierarchy}`);

      const validationProperties = requiredProperties.filter(p => p !== 'notification_team_contacts');
      
      validationProperties.forEach(propName => {
        const value = properties[propName];
        
        // Special conditional logic for corporate_account
        if (propName === 'corporate_account') {
          if (hierarchy === 'Corporate') {
            logs.push(`corporate_account: Skipped validation (hierarchy is Corporate)`);
            return;
          }
          if (!value || value === '') {
            missingProperties.push(propName);
            logs.push(`${propName}: MISSING (required because hierarchy is not Corporate)`);
          } else {
            logs.push(`${propName}: ${value} (Valid)`);
          }
        } else {
          if (!value || value === '') {
            missingProperties.push(propName);
            logs.push(`${propName}: MISSING`);
          } else {
            logs.push(`${propName}: ${value} (Valid)`);
          }
        }
      });

      // Company URL for notifications
      const companyUrl = `https://app.hubspot.com/contacts/${portalId}/record/0-2/${companyId}`;

      // PHASE 2: DOCUSIGN CREATION (if validation passes)
      let docusignResult = {};
      let finalSuccess = false;

      if (missingProperties.length === 0) {
        logs.push('✅ Validation passed, proceeding with DocuSign creation');
        
        try {
          // DocuSign configuration
          const integrationKey = "ad93e46e-5aa0-473b-8d9f-616db94d2614";
          const userId = "6717103e-13de-4e45-8ede-b63cb8cc52e1";
          const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAyUnk5O6WeIrfSNohbOyc/2lhMC6bfOYNzgf5Y4WG/KML/uHo
9oKah+WR5Yaqggb/Fz4PQ4QVHaKb7a7PBsIINyXKA2fAwxwClm5U1dR8TPuo/8Ku
GfMy0y68zsJeytqhdp8SfBZvL7jDNnKZdIPdSmUvNAndxzearhUMtmg3KxjBYGDk
LBgzp+utC8OQJzFaxjNg6ryxylETrh+HQGYKxKIXxo5UvoGksb2EKxFJa15TGrL9
Om5BgdUWm3D5yX4El14vDriAfrktk7DHp7W/d3WRteuzqDtVaqS0WWfdgwgNEl0d
85bi0IMi/FI8GOS2x1eq23x+2UoSwg7hG3pPrQIDAQABAoIBABPKV55olNPCN6TW
iX3Hn8H+7ubJVlFH3yiYIR13VefF8hp7xKdj/OSKnjcWb/I71N3IpMCLHnZc8/7A
9qrf7eXaKcv+6fVk7h4zN9UUQKpi/eEzl2GGx0L7L+YWNzKznzdl+W/I1uK2xD64
srzBcELtwt/Xbn41Sdh+ylKu2Wm7pzTY0j40kCAFyzgTs/KPCxE7UdCoSngP+Y7W
2NRb77ZhsYrGDEd5dyS0qTu7D+YSId9rSdbxoSYCBf/uK56JOI8iAgERczewgoS5
42M3PE8ONTpzrQCsFn0HS9//KANT2B3IMhHF7s4CHOt39hVPiQ88Crc5SWBNtpOU
XZFo7RMCgYEA6LZmQT8LruWBhpiKDl6Duu68U3e2nir0zd2+2PdosHKRE0zw8yJd
Nk1LdPHVeKcu9xEc8PRA8pDjVMzqZiQXvzWsmIBrmC+RcJZERIuJJfCpwaH20KjI
NuFpiJsbDRhil5u0QFxCpi6ejVWk5vTZXgE/PUH84haKBQ+nXC1wrWcCgYEA3W57
eiRhbaIY+Oei8wYUzE71GA7hUkhQd9dkzlbJBo6jdxPSsmFK4ph/405wDiTTr1RK
usJGVaZsis1tJcjYT+VgQWREl7EKcvGboJr8w4ydrM+vONco7+NyUeRwh+4PEDTp
/ShnJSyX7bB+v0TB2fwasdhZ55aqkHnuN8NoWcsCgYEAh1vRDpKFUS3dsVR4uPLw
3IKQuFwhtM53pmcc40bFdhytlfRjEokifrtm8JbZ/FwCTWN+2gi43l64XFL05ISJ
64Zk5i+MZfEFP9+nxdcD5zWdCCwVTDlge8uRfwv5KBzO/DBtICKKAe+L+dmfGVfC
N5OyHQeM+FTz4w2/4zXrHHECgYAyZMl/M7ZkoAZ05yqjilfDY5jN/9zxv/loPMH5
X7DiaCX1nLJP3GqRhUldruU7os/2UAWt2TbumTCMqlHTzpDEJhyw5SPjLeyF2kyj
0YIC8waTZLSpB/aOGcJTttyRYvFUq+Ywsjg/MpXlB0zhNMG1XXWp0eYsGZL5zHYV
hMhD3wKBgEN+Xg4eKUfHjkwFjzjbjpM0oHR7/CKwLsiy9c9+XY/4Q6vh1xRNar9d
sY2QDyitfI5gTtKiwlQI6b8WdZuz3NcAJqXX8GSGZAOxu3Y3ArzPuXHBJUlxyfLm
+i+toYBS9Zb1buVoDvFw6LVUy+7AvCL1QSBqNShkuvvKXZE4GsbE
-----END RSA PRIVATE KEY-----`;

          // Hardcoded recipient details
          const partnershipLevel = properties.partnership_level;
          const recipientEmail = 'john.creedon@upequity.com';
          const recipientName = 'John';
          const emailSubject = `Please sign this document - ${partnershipLevel || 'Default'} Agreement`;
          const emailMessage = `Please review and sign this ${partnershipLevel || 'Default'} Agreement.`;

          logs.push(`Partnership Level: ${partnershipLevel || 'Not specified'}`);
          logs.push(`Recipient: ${recipientName} <${recipientEmail}>`);

          // Generate JWT and get access token
          const jwtToken = generateJWT(integrationKey, userId, privateKey);
          
          const tokenResponse = await axios.post(
            'https://account.docusign.com/oauth/token',
            `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
          );

          if (tokenResponse.data.error === 'consent_required') {
            throw new Error('DocuSign JWT consent is required');
          }

          const accessToken = tokenResponse.data.access_token;

          // Get user account info
          const userInfoResponse = await axios.get('https://account.docusign.com/oauth/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          const userInfo = userInfoResponse.data;
          if (!userInfo.accounts || userInfo.accounts.length === 0) {
            throw new Error('No DocuSign accounts found');
          }

          const defaultAccount = userInfo.accounts.find(acc => acc.is_default) || userInfo.accounts[0];
          const baseUrl = defaultAccount.base_uri.endsWith('/restapi/v2.1') 
            ? defaultAccount.base_uri 
            : defaultAccount.base_uri + '/restapi/v2.1';
          const accountId = defaultAccount.account_id;

          // Template ID mapping
          const templateIdMapping = {
            "Gold": "0aefb289-cf0f-4f87-9615-259fdacaf710",
            "Gold with Rev Share": "b5dc05f3-c738-4b23-a53e-9e620cc70fa8",
            "Silver": "04c93d91-cbbd-4032-9f84-0f7879b46c05",
            "Silver with Rev Share": "0cd02f3e-5ee5-4b5e-bebc-2b510eef0982",
            "Bronze": "51b8968d-05ea-4130-9ad5-9544b84f61c8"
          };

          const templateNameMapping = {
            "Gold": "UpEquity Gold Level Marketing and Program Agreement",
            "Gold with Rev Share": "UpEquity Gold Level Marketing and Program Agreement with Rev Share",
            "Silver": "UpEquity Silver Level Marketing and Program Agreement",
            "Silver with Rev Share": "UpEquity Silver Level Marketing and Program Agreement with Rev Share",
            "Bronze": "UpEquity Bronze Level Marketing and Program Agreement"
          };

          const templateId = templateIdMapping[partnershipLevel];
          const templateName = templateNameMapping[partnershipLevel];

          if (!templateId) {
            throw new Error(`No DocuSign template found for partnership level: ${partnershipLevel}`);
          }

          // Create text tabs
          const textTabs = [];
          const otherFields = {
            "Partnership_Size": "partnership_size",
            "Partnership_Level": "partnership_level", 
            "Corporate_Account": "corporate_account",
            "Business_Type": "business_type",
            "Roster_Uploaded_Date": "roster_uploaded_date",
            "Hierarchy": "hierarchy"
          };

          Object.entries(otherFields).forEach(([tabLabel, paramKey]) => {
            const value = properties[paramKey] || '';
            textTabs.push({ tabLabel: tabLabel, value: value });
          });

          // Create envelope definition
          const envelopeDefinition = {
            emailSubject: emailSubject,
            emailBlurb: emailMessage,
            templateId: templateId,
            templateRoles: [{
              email: recipientEmail,
              name: recipientName,
              roleName: 'Partner Authorized Signer',
              routingOrder: '1',
              tabs: { textTabs: textTabs }
            }],
            customFields: {
              textCustomFields: [{
                name: "hubspot_company_id",
                value: companyId,
                required: "true",
                show: "false"
              }]
            },
            status: 'sent'
          };

          // Send envelope to DocuSign
          const docusignClient = axios.create({
            baseURL: baseUrl,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });

          const envelopeResponse = await docusignClient.post(`/accounts/${accountId}/envelopes`, envelopeDefinition);
          
          docusignResult = {
            success: true,
            envelopeId: envelopeResponse.data.envelopeId,
            envelopeStatus: envelopeResponse.data.status,
            templateUsed: templateName,
            templateId: templateId
          };

          finalSuccess = true;
          logs.push(`✅ DocuSign envelope created: ${docusignResult.envelopeId}`);

        } catch (docusignError) {
          logs.push(`❌ DocuSign creation failed: ${docusignError.message}`);
          docusignResult = {
            success: false,
            error: docusignError.message
          };
        }
      } else {
        logs.push(`❌ Validation failed. Missing ${missingProperties.length} properties: ${missingProperties.join(', ')}`);
      }

      // PHASE 3: CREATE NOTIFICATIONS AND TASKS
      let notifications = {};
      let taskDetails = {};
      let taskId = null;

      if (finalSuccess) {
        // SUCCESS NOTIFICATIONS
        const partnershipLevel = properties.partnership_level || 'Partnership';
        const signerName = properties.partnership_agreement_signer || 'the designated signer';
        
        notifications = {
          emailSubject: `DocuSign Agreement Sent for ${companyName}`,
          emailBody: `<p>${partnershipLevel} Partnership Agreement was sent to ${signerName}.</p><p><a href="${companyUrl}">View Company Record</a></p>`,
          slackMessage: `*✅ DocuSign Agreement Sent for ${companyName}*\n${partnershipLevel} Partnership Agreement was sent to ${signerName}.\n<${companyUrl}|View Company Record>`,
          plainTextMessage: `DocuSign Agreement Sent for ${companyName}\n\n${partnershipLevel} Partnership Agreement was sent to ${signerName}.\n\nCompany ID: ${companyId}\nCompany Link: ${companyUrl}`,
          statusMessage: `${partnershipLevel} Partnership Agreement sent to ${signerName} for ${companyName}.`
        };

        taskDetails = {
          properties: {
            hs_task_subject: `DocuSign Agreement Sent for ${companyName}`,
            hs_task_body: `${partnershipLevel} Partnership Agreement was sent to ${signerName} for ${companyName}.\n\nCompany ID: ${companyId}\nCompany Link: ${companyUrl}`,
            hs_task_priority: "MEDIUM",
            hs_task_status: "NOT_STARTED", 
            hs_task_type: "TODO",
            hs_timestamp: new Date().getTime()
          }
        };
      } else {
        // ERROR NOTIFICATIONS
        notifications = {
          emailSubject: `⚠️ DocuSign Cannot Be Sent for ${companyName} - Missing Fields`,
          emailBody: `<p><strong>DocuSign cannot be sent for ${companyName}</strong></p><ul>${missingProperties.map(prop => `<li>${prop}</li>`).join('')}</ul><p>Please complete these fields before attempting to send DocuSign again.</p><p><a href="${companyUrl}">View Company Record</a></p>`,
          slackMessage: `*⚠️ ALERT: DocuSign Cannot Be Sent for ${companyName}*\n\nThe following required properties are missing:\n• ${missingProperties.join('\n• ')}\n\nPlease complete these fields before attempting to send DocuSign again.\n<${companyUrl}|View Company Record>`,
          plainTextMessage: `ALERT: DocuSign Cannot Be Sent for ${companyName}\n\nThe following required properties are missing:\n${missingProperties.join(', ')}\n\nPlease complete these fields before attempting to send DocuSign again.\n\nCompany ID: ${companyId}\nCompany Link: ${companyUrl}`,
          statusMessage: `DocuSign cannot be sent for ${companyName}. Missing ${missingProperties.length} properties.`
        };

        taskDetails = {
          properties: {
            hs_task_subject: `ALERT: DocuSign Cannot Be Sent for ${companyName} - Missing Fields`,
            hs_task_body: `DocuSign cannot be sent for ${companyName} because the following required properties are missing:\n\n${missingProperties.join(', ')}\n\nPlease complete these fields before attempting to send DocuSign again.\n\nCompany ID: ${companyId}\nCompany Link: ${companyUrl}`,
            hs_task_priority: "HIGH",
            hs_task_status: "NOT_STARTED",
            hs_task_type: "TODO", 
            hs_timestamp: new Date().getTime()
          }
        };
      }

      // Create task and associate with contacts/company
      try {
        const taskResponse = await hubspotClient.crm.objects.tasks.basicApi.create(taskDetails);
        taskId = taskResponse.id;
        logs.push(`✅ Task created with ID: ${taskId}`);

        // Associate with company
        await hubspotClient.apiRequest({
          method: 'PUT',
          path: `/crm/v3/objects/tasks/${taskId}/associations/companies/${companyId}/task_to_company`,
        });

        // Associate with contacts
        let associatedContacts = 0;
        for (const contactId of teamContactIds) {
          try {
            await hubspotClient.apiRequest({
              method: 'PUT',
              path: `/crm/v3/objects/tasks/${taskId}/associations/contacts/${contactId}/task_to_contact`,
            });
            associatedContacts++;
          } catch (contactError) {
            logs.push(`⚠️ Failed to associate with contact ${contactId}: ${contactError.message}`);
          }
        }

        logs.push(`✅ Associated task with ${associatedContacts} contacts`);
      } catch (taskError) {
        logs.push(`⚠️ Error creating task: ${taskError.message}`);
      }

      // PHASE 4: PREPARE WEBHOOK PAYLOAD
      webhookPayload = {
        success: finalSuccess,
        docusignReady: missingProperties.length === 0,
        missingPropertiesCount: missingProperties.length,
        missingProperties: missingProperties.join(', '),
        
        // Company property values
        companyOwner: properties.hubspot_owner_id || '',
        partnershipSize: properties.partnership_size || '',
        partnershipLevel: properties.partnership_level || '',
        corporateAccount: properties.corporate_account || '',
        businessType: properties.business_type || '',
        rosterUploadedDate: properties.roster_uploaded_date || '',
        hierarchy: properties.hierarchy || '',
        partnershipAgreementSigner: properties.partnership_agreement_signer || '',

        // DocuSign results (if applicable)
        ...docusignResult,
        
        // Task details
        taskId: taskId,
        taskUrl: taskId ? `https://app.hubspot.com/tasks/${portalId}/task/${taskId}` : '',
        
        // Notification messages
        emailSubject: notifications.emailSubject,
        emailBody: notifications.emailBody,
        slackMessage: notifications.slackMessage,
        plainTextMessage: notifications.plainTextMessage,
        statusMessage: notifications.statusMessage,
        
        // General information  
        companyName: companyName,
        companyId: companyId,
        companyUrl: companyUrl,
        contactIds: teamContactIds.join(','),
        contactsFound: teamContactIds.length,
        
        // Webhook metadata
        webhookTimestamp: new Date().toISOString(),
        webhookAttempt: 1,
        scenarioType: finalSuccess ? 'SUCCESS' : (missingProperties.length > 0 ? 'MISSING_FIELDS' : 'ERROR'),
        version: '1.2.0',
        
        message: finalSuccess 
          ? `${properties.partnership_level || 'Partnership'} Agreement sent to ${properties.partnership_agreement_signer || 'signer'} for ${companyName}` 
          : `DocuSign cannot be sent for ${companyName}. Missing ${missingProperties.length} properties.`,
        
        logs: logs.join('\n')
      };

      logs.push(`📊 Webhook payload prepared. Scenario: ${webhookPayload.scenarioType}`);

    } catch (companyError) {
      logs.push(`❌ ERROR getting company data: ${companyError.message}`);
      
      // Error webhook payload
      webhookPayload = {
        success: false,
        docusignReady: false,
        message: `Workflow error: ${companyError.message}`,
        
        // Empty property values since we couldn't fetch them
        companyOwner: '', partnershipSize: '', partnershipLevel: '',
        corporateAccount: '', businessType: '', rosterUploadedDate: '',
        hierarchy: '', partnershipAgreementSigner: '',
        
        // Error notification messages
        emailSubject: `Error in DocuSign Validation Process`,
        emailBody: `<p><strong>Error occurred during DocuSign validation</strong></p><p>Error message: ${companyError.message}</p>`,
        slackMessage: `*⚠️ ERROR in DocuSign Validation Process*\nError message: ${companyError.message}`,
        plainTextMessage: `ERROR in DocuSign Validation Process\n\nError message: ${companyError.message}`,
        statusMessage: `Error validating DocuSign requirements: ${companyError.message}`,
        
        companyId: companyId,
        scenarioType: 'COMPANY_ERROR',
        webhookTimestamp: new Date().toISOString(),
        webhookAttempt: 1,
        version: '1.2.0',
        logs: logs.join('\n')
      };
    }

    // PHASE 5: SEND WEBHOOK WITH ENHANCED LOGGING AND RETRY LOGIC
    const webhookResult = await sendWebhookWithRetry(webhookPayload, logs);
    
    // Return response for UI
    return {
      status: webhookPayload.success ? "SUCCESS" : "ERROR",
      message: webhookPayload.success 
        ? webhookPayload.message 
        : `Missing required fields: ${webhookPayload.missingProperties}`,
      data: {
        companyName: webhookPayload.companyName,
        docusignReady: webhookPayload.docusignReady,
        envelopeId: webhookPayload.envelopeId,
        missingProperties: webhookPayload.missingProperties,
        missingPropertiesCount: webhookPayload.missingPropertiesCount,
        webhookSent: webhookResult.success,
        webhookAttempts: webhookResult.attempts,
        scenarioType: webhookPayload.scenarioType
      },
      timestamp: Date.now()
    };

  } catch (error) {
    logs.push(`❌ MAIN ERROR: ${error.message}`);
    
    // Send error webhook
    const errorWebhookPayload = {
      success: false,
      docusignReady: false,
      message: `Critical error: ${error.message}`,
      logs: logs.join('\n'),
      companyId: context.parameters.companyId || 'unknown',
      scenarioType: 'CRITICAL_ERROR',
      webhookTimestamp: new Date().toISOString(),
      webhookAttempt: 1,
      version: '1.2.0'
    };

    const webhookResult = await sendWebhookWithRetry(errorWebhookPayload, logs);

    return {
      status: "ERROR",
      message: `Critical error: ${error.message}`,
      data: {
        webhookSent: webhookResult.success,
        webhookAttempts: webhookResult.attempts
      },
      timestamp: Date.now()
    };
  }
};

/**
 * Enhanced webhook sending with retry logic and detailed logging
 */
async function sendWebhookWithRetry(payload, logs, maxRetries = 3) {
  const webhookUrl = 'https://api-na1.hubapi.com/automation/v4/webhook-triggers/20424362/YE7bXwk';
  
  logs.push(`🚀 Starting webhook send. Scenario: ${payload.scenarioType}, Attempt: 1/${maxRetries}`);
  logs.push(`📊 Payload size: ${JSON.stringify(payload).length} characters`);
  
  // Console logs array for function logging
  const consoleLogs = [];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Update attempt number in payload
      const attemptPayload = {
        ...payload,
        webhookAttempt: attempt,
        webhookTimestamp: new Date().toISOString()
      };
      
      logs.push(`📤 Webhook attempt ${attempt}: POST ${webhookUrl}`);
      consoleLogs.push(`[WEBHOOK] Attempt ${attempt} - Sending webhook for scenario: ${payload.scenarioType}`);
      
      const startTime = Date.now();
      
      const response = await axios.post(webhookUrl, attemptPayload, {
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'HubSpot-DocuSign-Integration/1.2.0'
        },
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500; // Don't throw for 4xx errors, only 5xx
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.status >= 200 && response.status < 300) {
        logs.push(`✅ Webhook sent successfully on attempt ${attempt} (${duration}ms)`);
        logs.push(`📥 Response status: ${response.status}`);
        logs.push(`📥 Response data: ${JSON.stringify(response.data)}`);
        
        consoleLogs.push(`[WEBHOOK] ✅ SUCCESS - Attempt ${attempt} completed in ${duration}ms`);
        consoleLogs.push(`[WEBHOOK] Response: ${response.status} - ${JSON.stringify(response.data)}`);
        
        // Log to function console for debugging
        logToConsole(consoleLogs, payload.scenarioType, true);
        
        return { success: true, attempts: attempt, lastResponse: response.data };
      } else {
        logs.push(`⚠️ Webhook attempt ${attempt} failed with status ${response.status}`);
        logs.push(`📥 Error response: ${JSON.stringify(response.data)}`);
        
        consoleLogs.push(`[WEBHOOK] ⚠️ FAILED - Attempt ${attempt} status: ${response.status}`);
        consoleLogs.push(`[WEBHOOK] Error data: ${JSON.stringify(response.data)}`);
        
        if (attempt === maxRetries) {
          logs.push(`❌ All webhook attempts failed. Final status: ${response.status}`);
          consoleLogs.push(`[WEBHOOK] ❌ ALL ATTEMPTS FAILED - Final status: ${response.status}`);
          logToConsole(consoleLogs, payload.scenarioType, false);
          return { success: false, attempts: attempt, lastError: response.data };
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        logs.push(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
    } catch (error) {
      logs.push(`❌ Webhook attempt ${attempt} error: ${error.message}`);
      consoleLogs.push(`[WEBHOOK] ❌ ERROR - Attempt ${attempt}: ${error.message}`);
      
      if (error.code) {
        logs.push(`📊 Error code: ${error.code}`);
        consoleLogs.push(`[WEBHOOK] Error code: ${error.code}`);
      }
      
      if (error.response) {
        logs.push(`📥 Error response status: ${error.response.status}`);
        logs.push(`📥 Error response data: ${JSON.stringify(error.response.data)}`);
        consoleLogs.push(`[WEBHOOK] Error response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      
      if (attempt === maxRetries) {
        logs.push(`❌ All webhook attempts failed. Final error: ${error.message}`);
        consoleLogs.push(`[WEBHOOK] ❌ ALL ATTEMPTS FAILED - Final error: ${error.message}`);
        logToConsole(consoleLogs, payload.scenarioType, false);
        return { success: false, attempts: attempt, lastError: error.message };
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      logs.push(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  logs.push(`❌ Webhook sending failed after ${maxRetries} attempts`);
  consoleLogs.push(`[WEBHOOK] ❌ FINAL FAILURE after ${maxRetries} attempts`);
  logToConsole(consoleLogs, payload.scenarioType, false);
  
  return { success: false, attempts: maxRetries, lastError: 'Max retries exceeded' };
}

/**
 * Log webhook results to function console for debugging
 */
function logToConsole(consoleLogs, scenarioType, success) {
  try {
    // This will be logged in the HubSpot function logs
    const logMessage = {
      timestamp: new Date().toISOString(),
      scenarioType: scenarioType,
      webhookSuccess: success,
      details: consoleLogs
    };
    
    console.log('🔍 WEBHOOK DEBUG INFO:', JSON.stringify(logMessage, null, 2));
    
    // Also log each individual message for easier viewing
    consoleLogs.forEach(log => console.log(log));
    
    if (success) {
      console.log(`🎉 WEBHOOK SUCCESS for scenario: ${scenarioType}`);
    } else {
      console.error(`💥 WEBHOOK FAILURE for scenario: ${scenarioType}`);
    }
    
  } catch (consoleError) {
    console.error('Error logging to console:', consoleError);
  }
}

/**
 * Generate JWT token for DocuSign authentication
 */
function generateJWT(integrationKey, userId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: integrationKey,
    sub: userId,
    iat: now,
    exp: now + 3600,
    aud: 'account.docusign.com',
    scope: 'signature impersonation extended'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signatureBase = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureBase);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${signatureBase}.${signature}`;
}