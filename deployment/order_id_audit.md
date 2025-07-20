# 📋 Order ID Field Usage Audit

**Migration**: Remove `order_id` field from NAD+ application  
**Date**: July 20, 2025  
**Total References Found**: 26+ locations

---

## 🗃️ Database Schema References

### **nad_test_ids Table**
- **Column**: `order_id` BIGINT(20) DEFAULT NULL
- **Index**: `idx_order_id` (KEY)
- **Usage**: Links tests to Shopify orders for fulfillment tracking

### **nad_test_scores Table** 
- **Column**: `order_id` BIGINT(20) NOT NULL
- **Index**: `idx_order_id` (KEY)  
- **Usage**: Duplicate reference, linked via test_id already

---

## 🔧 Backend References (`server.js`)

### **Database Migration Functions**
**Lines 92, 100**: Cleanup functions reference order_id
```javascript
// Migration helper references
AND COLUMN_NAME IN ('status', 'is_activated', 'order_id', 'customer_id', 'activated_by', 'activated_date')
const columnsToRemove = ['status', 'is_activated', 'order_id', 'customer_id', 'activated_by', 'activated_date'];
```
**Impact**: Remove from migration cleanup logic
**Risk**: Low

### **Shopify Webhook Endpoints**
**Lines 500, 539, 565**: Order fulfillment tracking
```javascript
// Line 500: Test creation with order linkage
test_id, generated_by, order_id, customer_id, shopify_order_number

// Lines 539, 565: Order-based queries
WHERE order_id = ?
```
**Impact**: Remove order linkage from webhook processing
**Risk**: Medium - affects Shopify integration

### **Test Verification APIs**
**Lines 614, 695**: Test verification responses
```javascript
// Response includes order information
order_id: test.order_id,
```
**Impact**: Remove from API responses
**Risk**: Low - clients don't depend on this field

### **Admin Interface APIs**
**Lines 633, 1468**: Admin test listings
```javascript
// Line 633: Lab test queries
SELECT test_id, status, customer_id, order_id, batch_id, created_date, activated_date

// Line 1468: Admin test listings  
ti.order_id,
```
**Impact**: Remove from SELECT queries and response data
**Risk**: Low - UI will be updated accordingly

### **Lab Processing APIs** 
**Lines 732, 751, 759**: Lab test processing
```javascript
// Test data queries include order_id
SELECT test_id, status, customer_id, order_id, batch_id, created_date, activated_date
test.order_id, test.customer_id, test.customer_id, technician_id,
```
**Impact**: Remove from lab interface data
**Risk**: Low - lab doesn't need order tracking

### **Customer Interface APIs**
**Lines 2304, 2335, 2366, 2429**: Customer test operations
```javascript
// Customer verification and activation
SELECT test_id, status, activated_date, customer_id, order_id, batch_id
order_id: test.order_id,
```
**Impact**: Remove from customer API responses
**Risk**: Low - customers don't need order info

---

## 💻 Frontend References

### **Admin Interface (`admin.html`)**

**Line 1076**: Search functionality
```javascript
(test.order_id && test.order_id.toString().toLowerCase().includes(searchTerm)) ||
```
**Impact**: Remove order_id from search filters
**Risk**: Low - other search fields remain

**Line 1256**: Test detail display
```javascript
Order ID: ${test.order_id || 'Manual'}
```
**Impact**: Remove order display from test details
**Risk**: Low - cosmetic change only

### **Test Management (`sections/tests.php`)**

**Line 111**: Table column header
```javascript
<th class="sortable" data-sort="order_id">
```
**Impact**: Remove "Order ID" column from table
**Risk**: Low - table layout adjustment needed

**Line 555**: Search logic
```javascript
test.order_id.toString().includes(searchTerm)
```
**Impact**: Remove from search functionality
**Risk**: Low - search will work with remaining fields

**Line 692**: Table cell display
```javascript
<td>#${test.order_id}</td>
```
**Impact**: Remove order column from table rows
**Risk**: Low - UI layout change

**Line 1016**: Detail modal display
```javascript
🛒 Order ID: ${test.order_id}
```
**Impact**: Remove order info from modal
**Risk**: Low - modal still functional

### **Dropdown Fix (`dropdown-fix.js`)**

**Line 127**: Search filter logic
```javascript
(test.order_id && test.order_id.toString().toLowerCase().includes(searchTerm)) ||
```
**Impact**: Remove order_id from search filters
**Risk**: Low - fallback search functionality

**Line 199**: Fallback table rendering
```javascript
<td>${test.order_id || 'N/A'}</td>
```
**Impact**: Remove order column from fallback table
**Risk**: Low - backup rendering logic

---

## 📄 Supporting Files

### **Mock Data (`mock-tests.json`)**
**Lines 6, 15**: Test samples include order_id
```json
"order_id": 12345,
"order_id": 12346,
```
**Impact**: Remove from sample data
**Risk**: None - test data only

### **Migration Scripts**
**Multiple files**: References in cleanup and backup scripts
**Impact**: Update migration helpers
**Risk**: Low - maintenance scripts

---

## 🔄 Migration Strategy by Component

### **Phase 2: Backend APIs (Medium Risk)**
1. **Shopify Webhooks**: Remove order tracking while maintaining fulfillment
2. **Admin APIs**: Clean SELECT queries and response data
3. **Lab APIs**: Remove order references from test processing
4. **Customer APIs**: Clean activation and verification responses

### **Phase 3: Frontend UI (Low Risk)** 
1. **Search Functions**: Remove order_id from all search logic
2. **Table Display**: Remove order columns and headers
3. **Detail Views**: Remove order information display
4. **Fallback Logic**: Clean backup rendering functions

### **Phase 4: Database Schema (Low Risk)**
1. **Remove Index**: Drop `idx_order_id` index
2. **Remove Column**: Drop `order_id` column from nad_test_ids
3. **Evaluate**: Determine nad_test_scores.order_id necessity

---

## 🎯 Dependencies and Relationships

### **Current Usage Patterns**
- **Shopify Integration**: Links tests to store orders for fulfillment tracking
- **Search Functionality**: Allows admins to find tests by order number
- **Display Information**: Shows order context in admin interfaces
- **Test Verification**: Provides order linkage in API responses

### **Post-Removal Functionality**
- **Shopify Integration**: Will continue using test_id and customer_id
- **Search Functionality**: Will use test_id, customer_id, batch_id
- **Display Information**: Will show test and batch information
- **Test Verification**: Will use test_id as primary identifier

---

## ✅ Migration Requirements

### **Must Maintain**
- ✅ Shopify webhook processing (order fulfillment)
- ✅ Test search and filtering capabilities
- ✅ Admin interface functionality
- ✅ Lab test processing workflow
- ✅ Customer test activation process

### **Safe to Remove**
- ✅ Order ID display in UI
- ✅ Order-based search functionality
- ✅ Order linkage in API responses
- ✅ Order tracking in test details

---

## 🚨 Risk Assessment Summary

### **High Risk**: None identified
### **Medium Risk**: 
- Shopify webhook processing (3 locations)
- Admin API response changes (2 locations)

### **Low Risk**:
- Frontend UI updates (8 locations)
- Search functionality changes (4 locations)
- Database schema changes (2 locations)
- Migration script updates (2 locations)

---

## 📊 Testing Requirements

### **Critical Test Cases**
1. **Shopify Webhook**: Order fulfillment processing without order_id
2. **Test Search**: Search functionality with remaining fields
3. **Admin Interface**: Test management without order display
4. **Lab Interface**: Test processing workflow integrity
5. **Customer Interface**: Test activation without order linkage

### **Validation Criteria**
- All existing functionality works without order_id
- No broken UI elements or missing data
- API responses remain well-formed
- Database queries execute successfully
- Performance maintained or improved

---

*Audit completed: July 20, 2025*  
*Total locations to update: 26+*  
*Estimated migration time: 3-4 hours*