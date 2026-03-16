/**
 * Prospection Services - Barrel Export
 */

// Channel senders
export { sendWhatsApp, sendWhatsAppReply } from './channels/whatsapp'
export { sendProspectionSMS } from './channels/sms'
export { sendProspectionEmail, sendProspectionEmailBatch } from './channels/email'

// Message queue
export {
  enqueueCampaignMessages,
  processBatch,
  pauseCampaign,
  resumeCampaign,
  retryFailed,
  getQueueStats,
} from './message-queue'

// AI
export {
  generateAIResponse,
  generateWithFallback,
  shouldEscalate,
} from './ai-response'

// Templates
export {
  renderTemplate,
  extractVariables,
  validateTemplate,
  renderPreview,
} from './template-renderer'

// Import
export {
  parseCSV,
  suggestColumnMapping,
  validateRows,
  checkDuplicates,
  bulkInsertContacts,
  importContacts,
  syncAttorneysFromDatabase,
} from './import-service'

// Analytics
export {
  getCampaignStats,
  getOverviewStats,
  getChannelPerformance,
} from './analytics'

// Webhooks
export {
  verifyTwilioSignature,
  verifyResendSignature,
} from './webhook-security'
