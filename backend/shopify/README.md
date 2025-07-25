# Shopify Integration for NAD Test System

This module provides seamless integration between Shopify and the NAD test system, allowing customers to activate test kits directly from their Shopify purchase experience.

## Features

- **Webhook-based activation**: Customers trigger test kit activation from Shopify
- **Dual authentication**: Supports both Shopify customers and direct email customers
- **Session management**: Secure portal access with time-limited tokens
- **Metafield synchronization**: Uses Shopify customer metafields for activation requests
- **Backward compatibility**: Existing email-based customers continue to work

## Architecture

```
Shopify Store → Webhook → NAD Server → Database Update → Portal Access
     ↓              ↓           ↓              ↓             ↓
  Customer    Metafield    Test Kit      Session      Customer Portal
  Purchase    Trigger     Activation     Creation         Access
```

## Setup Instructions

### 1. Database Migration

Run the database migration to add Shopify support:

```bash
mysql -u your_user -p nad_database < backend/migrations/add_shopify_integration.sql
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Enable Shopify integration
ENABLE_SHOPIFY_INTEGRATION=true

# Shopify credentials
SHOPIFY_STORE_URL=youstore.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_access_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Session security
SESSION_SECRET=your-secure-session-key
```

### 3. Shopify App Configuration

Create a private app in Shopify Admin with these permissions:
- `read_customers`
- `write_customers` 
- `read_customer_metafields`
- `write_customer_metafields`

### 4. Webhook Setup

Configure webhook in Shopify Admin:
- **URL**: `https://yourdomain.com/shopify/webhooks/customer-update`
- **Event**: Customer update
- **Format**: JSON

### 5. Metafield Definitions

Create these metafields in Shopify Admin:

1. **customer.test_kit_activation** (JSON)
   - Used for activation requests from store

2. **customer.test_kit_log** (Single line text)
   - Stores active test kit ID

## API Endpoints

### Webhook Endpoints
- `POST /shopify/webhooks/customer-update` - Processes customer updates
- `POST /shopify/webhooks/order-create` - Links test kits to orders

### Portal Endpoints
- `GET /shopify/portal?t=token` - Portal entry with authentication token
- `GET /shopify/check-portal-access?session=id` - Polling for activation status

### Admin Endpoints (Development)
- `GET /shopify/admin/webhooks` - View recent webhook events
- `POST /shopify/admin/replay-webhook/:id` - Replay webhook for testing

## Customer Flow

### Shopify Customer Flow
1. Customer purchases test kit in Shopify store
2. Customer initiates activation (via Shopify interface)
3. Shopify creates `customer.test_kit_activation` metafield
4. Webhook fires to NAD server
5. Server validates and activates test kit
6. Server creates portal session token
7. Customer redirected to NAD portal with authentication

### Legacy Customer Flow
1. Customer visits NAD portal directly
2. Customer enters email and test ID
3. System verifies and activates test kit
4. Customer accesses portal immediately

## Database Schema

### New Tables
- `nad_shopify_customers` - Shopify customer data
- `nad_portal_sessions` - Portal authentication sessions
- `nad_shopify_webhooks` - Webhook event log
- `nad_shopify_metafields_log` - Metafield operations audit

### Modified Tables
- `nad_test_ids` - Added `shopify_customer_id`, `shopify_order_id`

## Security Features

- HMAC signature verification for webhooks
- Time-limited portal sessions (30 minutes)
- One-time use authentication tokens
- Encrypted session storage
- Request rate limiting

## Monitoring & Debugging

### Health Check
```bash
curl https://yourdomain.com/shopify/health
```

### Webhook Logs
All webhook events are logged in `nad_shopify_webhooks` table for debugging.

### Session Statistics
```bash
# View active sessions
curl https://yourdomain.com/shopify/health
```

## Error Handling

- **Invalid webhook signature**: Returns 401, prevents processing
- **Expired activation request**: Cleans up metafield, returns success to Shopify
- **Test kit not found**: Returns error in polling response
- **Database errors**: Logged and reported in webhook response

## Production Considerations

1. **Use Redis for session storage** instead of in-memory Map
2. **Configure rate limiting** on webhook endpoints
3. **Set up monitoring** for webhook failures
4. **Enable HTTPS** for all communications
5. **Regular cleanup** of expired sessions and logs

## Testing

### Test Webhook Locally
```bash
# Use ngrok for local webhook testing
ngrok http 3000

# Configure webhook URL in Shopify:
# https://abc123.ngrok.io/shopify/webhooks/customer-update
```

### Manual Activation Test
```bash
# Create test metafield in Shopify Admin
{
  "testKitId": "2025-07-123-ABC123",
  "timestamp": 1234567890000,
  "sessionId": "test-session-123",
  "requestType": "activation"
}
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving**: Check ngrok/domain, verify Shopify webhook config
2. **Invalid signature**: Verify `SHOPIFY_WEBHOOK_SECRET` matches Shopify
3. **Session expired**: Portal tokens expire after 30 minutes
4. **Test kit not found**: Verify test ID format and database records

### Debug Endpoints
- `GET /shopify/admin/webhooks` - View recent webhook events
- `GET /shopify/health` - Integration health status
- Database tables for audit trails and debugging