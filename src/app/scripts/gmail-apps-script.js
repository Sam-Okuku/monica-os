// Monica OS — Gmail Signal Ingestion Script
// Paste this into script.google.com in Monica's Google account.
// Set a time-driven trigger: onNewEmail() → every 5 minutes.
// Set Script Properties: MONICA_WEBHOOK_URL and MONICA_WEBHOOK_SECRET

var PROCESSED_LABEL_NAME = 'MonicaOS/Processed';
var MAX_EMAILS_PER_RUN = 10;

function onNewEmail() {
  var webhookUrl = PropertiesService.getScriptProperties().getProperty('MONICA_WEBHOOK_URL');
  var secret = PropertiesService.getScriptProperties().getProperty('MONICA_WEBHOOK_SECRET');

  if (!webhookUrl) {
    Logger.log('MONICA_WEBHOOK_URL not set in Script Properties');
    return;
  }

  var processedLabel = getOrCreateLabel(PROCESSED_LABEL_NAME);
  var threads = GmailApp.search('is:unread -label:MonicaOS/Processed', 0, MAX_EMAILS_PER_RUN);

  threads.forEach(function(thread) {
    var messages = thread.getMessages();
    var message = messages[messages.length - 1]; // Latest message in thread

    var payload = {
      sender: message.getFrom(),
      subject: message.getSubject(),
      body: message.getPlainBody().slice(0, 600),
      receivedAt: message.getDate().toISOString(),
      hasIcsAttachment: message.getAttachments().some(function(a) {
        return a.getName().endsWith('.ics');
      }),
      threadId: thread.getId(),
    };

    var body = JSON.stringify(payload);
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: body,
      muteHttpExceptions: true,
    };

    if (secret) {
      var signature = computeHmac(body, secret);
      options.headers = { 'x-monica-signature': signature };
    }

    try {
      var response = UrlFetchApp.fetch(webhookUrl, options);
      if (response.getResponseCode() === 200) {
        thread.addLabel(processedLabel);
        Logger.log('Processed: ' + message.getSubject());
      } else {
        Logger.log('Error ' + response.getResponseCode() + ': ' + message.getSubject());
      }
    } catch (e) {
      Logger.log('Exception: ' + e.toString());
    }
  });
}

function getOrCreateLabel(name) {
  var label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  return label;
}

function computeHmac(message, secret) {
  var signature = Utilities.computeHmacSha256Signature(message, secret);
  return signature.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

// Test function — run once to verify setup
function testConnection() {
  var webhookUrl = PropertiesService.getScriptProperties().getProperty('MONICA_WEBHOOK_URL');
  var testPayload = JSON.stringify({
    sender: 'test@example.com',
    subject: 'Test signal from Monica OS Apps Script',
    body: 'This is a test email to verify the Monica OS connection is working.',
  });
  var response = UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: testPayload,
    muteHttpExceptions: true,
  });
  Logger.log('Response: ' + response.getResponseCode() + ' — ' + response.getContentText());
}