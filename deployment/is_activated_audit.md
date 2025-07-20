# is_activated Field Audit Report

## Summary
Total occurrences found: 100+ references across backend/server.js

## Categorized Usage

### 1. **Status Determination Logic**
- **Location**: Various endpoints
- **Current Logic**: 
  ```javascript
  if (test.is_activated) status = 'activated';
  if (test.is_activated === 1) // test is activated
  if (test.is_activated === 0) // test is pending
  ```
- **Replacement**: Use `status` field directly

### 2. **Update Operations**
- **Webhook handlers** (lines 341, 1473, 1483):
  ```sql
  UPDATE nad_test_ids SET is_activated = 1, activated_date = NOW()
  ```
- **Replacement**: 
  ```sql
  UPDATE nad_test_ids SET status = 'activated', activated_date = NOW()
  ```

### 3. **Query Filters**
- **Lab pending tests** (line 921):
  ```sql
  WHERE ti.is_activated = 1
  ```
- **Customer verification** (line 441):
  ```sql
  WHERE test_id = ? AND is_activated = 1
  ```
- **Replacement**: 
  ```sql
  WHERE ti.status = 'activated'
  WHERE test_id = ? AND status IN ('activated', 'completed')
  ```

### 4. **Statistics & Counting**
- **Dashboard stats** (lines 246-247, 935, 1325, 1385, 1425):
  ```sql
  COUNT(CASE WHEN is_activated = 1 THEN 1 END) as activated_tests
  COUNT(CASE WHEN is_activated = 0 THEN 1 END) as pending_tests
  ```
- **Replacement**:
  ```sql
  COUNT(CASE WHEN status = 'activated' THEN 1 END) as activated_tests
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tests
  ```

### 5. **Activation/Deactivation Endpoints**
- **/api/admin/activate-test/:testId** (lines 1050, 1063)
- **/api/admin/deactivate-test/:testId** (lines 1167, 1180)
- **/api/admin/tests/bulk-activate** (line 1473-1484)
- **Replacement**: Update `status` field instead

### 6. **Validation Checks**
- Check if already activated (line 1050):
  ```javascript
  if (currentTest.is_activated === 1) // already activated
  ```
- **Replacement**:
  ```javascript
  if (currentTest.status !== 'pending') // already activated or completed
  ```

### 7. **Schema Cleanup**
- Already have cleanup for nad_test_scores (line 94)
- Need similar cleanup for nad_test_ids after migration

## Critical Endpoints to Update

1. **Shopify Webhooks**
   - `/webhook/shopify/order-paid`
   - `/webhook/shopify/order-fulfilled`

2. **Lab Interface**
   - `/api/lab/pending-tests`
   - `/api/lab/stats`

3. **Admin Interface**
   - `/api/admin/tests`
   - `/api/admin/activate-test/:testId`
   - `/api/admin/deactivate-test/:testId`
   - `/api/admin/tests/bulk-activate`
   - `/api/admin/tests/bulk-deactivate`

4. **Customer Interface**
   - `/api/customer/verify-test`
   - `/api/customer/test-status/:test_id`

5. **Dashboard/Analytics**
   - `/api/admin/dashboard/stats`
   - `/api/admin/dashboard/analytics`

## Testing Requirements

1. **Activation Flow**: Verify pending → activated → completed transitions
2. **Bulk Operations**: Test bulk activate/deactivate
3. **Webhooks**: Ensure Shopify integration still works
4. **Statistics**: Verify counts are accurate
5. **Lab Interface**: Ensure only activated tests show in pending queue
6. **Customer Access**: Verify customers can only access activated/completed tests