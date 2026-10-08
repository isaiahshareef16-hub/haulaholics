/**
 * Haul-A-Holics — Card on File Server
 *
 * Saves customer cards to Square WITHOUT charging them.
 * Flow: Customer fills form → Square SDK tokenizes card →
 *       This server creates/finds customer → saves card to their profile.
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const { Client, Environment } = require('square');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Square Client ──
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'sandbox'
    ? Environment.Sandbox
    : Environment.Production
});

const { customersApi, cardsApi } = squareClient;

// ── GET /api/square-config ──
// Returns the public Application ID and Location ID to the frontend.
// The Access Token is NEVER sent to the browser.
app.get('/api/square-config', (req, res) => {
  res.json({
    applicationId: process.env.SQUARE_APPLICATION_ID,
    locationId: process.env.SQUARE_LOCATION_ID
  });
});

// ── POST /api/save-card ──
// Takes: sourceId (card token), firstName, lastName, email, phone
// Does:  1. Find or create customer in Square
//        2. Save card to that customer's profile (no charge)
// Returns: { success: true } or { success: false, error: "..." }
app.post('/api/save-card', async (req, res) => {
  try {
    const { sourceId, firstName, lastName, email, phone } = req.body;

    // Validate inputs
    if (!sourceId || !firstName || !lastName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required.'
      });
    }

    // Step 1: Search for existing customer by email
    let customerId;

    try {
      const searchResult = await customersApi.searchCustomers({
        query: {
          filter: {
            emailAddress: {
              exact: email
            }
          }
        }
      });

      if (searchResult.result.customers && searchResult.result.customers.length > 0) {
        // Customer exists — use their ID
        customerId = searchResult.result.customers[0].id;
        console.log(`Found existing customer: ${customerId}`);
      }
    } catch (searchErr) {
      // Search failed — that's OK, we'll create a new customer
      console.log('Customer search returned no results, creating new customer.');
    }

    // Step 2: Create customer if not found
    if (!customerId) {
      const createResult = await customersApi.createCustomer({
        idempotencyKey: crypto.randomUUID(),
        givenName: firstName,
        familyName: lastName,
        emailAddress: email,
        phoneNumber: phone,
        referenceId: `haulaholics-web-${Date.now()}`,
        note: 'Card on file saved via Haul-A-Holics web form'
      });

      customerId = createResult.result.customer.id;
      console.log(`Created new customer: ${customerId}`);
    }

    // Step 3: Save card to customer profile (NO CHARGE)
    const cardResult = await cardsApi.createCard({
      idempotencyKey: crypto.randomUUID(),
      sourceId: sourceId,
      card: {
        customerId: customerId
      }
    });

    const savedCard = cardResult.result.card;
    console.log(`Card saved: ${savedCard.cardBrand} ending ${savedCard.last4} for customer ${customerId}`);

    res.json({
      success: true,
      card: {
        brand: savedCard.cardBrand,
        last4: savedCard.last4,
        expMonth: savedCard.expMonth,
        expYear: savedCard.expYear
      }
    });

  } catch (err) {
    console.error('Save card error:', JSON.stringify(err.result || err.message || err, null, 2));

    // Parse Square API errors for a user-friendly message
    let errorMessage = 'Unable to save card. Please try again.';

    if (err.result && err.result.errors) {
      const sqError = err.result.errors[0];
      switch (sqError.code) {
        case 'INVALID_CARD':
        case 'VERIFY_CVV_FAILURE':
        case 'VERIFY_AVS_FAILURE':
          errorMessage = 'Your card could not be verified. Please check your card details.';
          break;
        case 'CARD_DECLINED':
          errorMessage = 'Your card was declined. Please try a different card.';
          break;
        case 'INVALID_EXPIRATION':
          errorMessage = 'Your card expiration date is invalid.';
          break;
        case 'GENERIC_DECLINE':
          errorMessage = 'Your card was declined. Please contact your bank or try a different card.';
          break;
        default:
          errorMessage = 'Unable to save card. Please try again or contact us.';
      }
    }

    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
});

// ── Serve the frontend for all other routes ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚛 Haul-A-Holics Card on File server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.SQUARE_ENVIRONMENT || 'production'}`);
  console.log(`   Open: http://localhost:${PORT}\n`);
});
