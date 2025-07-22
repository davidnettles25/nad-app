# NAD Customer Portal - Supplement Data Flow

## Overview
This document traces the complete flow of supplement data from customer form submission to database storage in the NAD test cycle application.

## Data Flow Summary

### 1. Customer Portal Supplement Form
**Location**: `/frontend/customer/sections/supplements.html`
- Customer reaches this page after test verification (step 2 of 3)
- Form displays:
  - Grid of selectable supplements loaded from API
  - Amount input fields for each selected supplement
  - Free text fields for other supplements and health conditions

### 2. Frontend JavaScript Handler
**Location**: `/frontend/customer/js/customer-portal.js`

#### Key Functions:
- `initSupplementHandlers()` (line 190): Initializes the supplement form
- `loadSupplements()` (line 297): Fetches supplement list from API
- `handleSupplementSubmission()` (line 228): Processes form submission

#### Data Collection Process:
```javascript
// Line 237-249: Collect supplement data with amounts
const selectedSupplements = Array.from(document.querySelectorAll('input[name="supplements"]:checked'))
    .map(input => {
        return {
            id: input.value,
            name: supplementItem.querySelector('.supplement-name').textContent,
            amount: parseFloat(amountInput.value) || 0,
            unit: unitElement.textContent
        };
    });

// Line 254-265: Prepare activation data
const activationData = {
    testId: this.testData.testId,
    email: this.userData.email,
    firstName: this.userData.firstName,
    lastName: this.userData.lastName,
    supplements: {
        selected: selectedSupplements,
        other: otherSupplements,
        health_conditions: healthConditions,
        submitted_at: new Date().toISOString()
    }
};
```

### 3. API Client
**Location**: `/frontend/shared/js/api-client.js`
- `activateTest()` method (line 107) sends POST request to backend

### 4. Backend API Endpoint
**Location**: `/backend/server.js`
**Endpoint**: `POST /api/customer/activate-test`

#### Key Processing:
1. Receives request body with test ID and supplement data
2. Validates test exists and is in 'pending' status
3. Updates test status to 'activated'
4. Stores supplement data in database

```javascript
// Line 68-77: Store supplement data
await db.execute(`
    INSERT INTO nad_user_supplements (
        test_id, customer_id, supplements_with_dose, habits_notes, created_at
    ) VALUES (?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
    supplements_with_dose = VALUES(supplements_with_dose), updated_at = NOW()
`, [testId, customerId || test.customer_id, JSON.stringify(supplements), '']);
```

### 5. Database Storage
**Table**: `nad_user_supplements`
**Schema** (from `/deployment/schema.sql`):
```sql
CREATE TABLE `nad_user_supplements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `test_id` varchar(255) NOT NULL,
  `customer_id` bigint(20) NOT NULL,
  `supplements_with_dose` text NOT NULL,  -- JSON data stored here
  `habits_notes` text DEFAULT NULL,
  `created_at` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_test_id` (`test_id`),
  KEY `idx_customer_id` (`customer_id`)
)
```

### 6. Data Retrieval
**Endpoint**: `GET /api/customer/test-detail/:testId`
- Joins `nad_test_ids` with `nad_user_supplements`
- Parses JSON supplement data for display
- Handles both new JSON format and legacy string format

## Supplement Management System

### Admin Portal
**Location**: `/frontend/admin/sections/supplements.html`
- CRUD operations for supplement database
- Manages the list of supplements shown to customers

### Supplement Master Table
**Table**: `nad_supplements`
```sql
CREATE TABLE `nad_supplements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Other',
  `description` text DEFAULT NULL,
  `default_dose` varchar(100) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  -- ... other fields
)
```

### API Endpoints for Supplement Management:
- `GET /api/supplements` - List all supplements
- `POST /api/supplements` - Create new supplement
- `PUT /api/supplements/:id` - Update supplement
- `DELETE /api/supplements/:id` - Delete supplement

## Complete Workflow

1. **Test Verification** → Customer enters test ID
2. **Supplement Collection** → Customer selects supplements and amounts
3. **Test Activation** → Supplements submitted with test activation
4. **Database Storage** → JSON data stored in `nad_user_supplements`
5. **Results Display** → Supplement data shown in test details

## Key Features

- **Two-stage process**: Test verification first, then supplement collection
- **JSON storage**: Flexible storage format for supplement data
- **Backward compatibility**: Handles both JSON and legacy string formats
- **Admin management**: Full CRUD for supplement master list
- **Customer privacy**: Supplements linked to customer ID and test ID