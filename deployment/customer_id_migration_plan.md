# 🔄 NAD+ Customer ID Migration Plan

## Migration Overview

**Objective**: Migrate `customer_id` from `BIGINT(20)` to `VARCHAR(255)` to support Shopify Multipass email-based authentication  
**Data Type Change**: Numeric IDs → Email addresses from Shopify Multipass  
**Complexity**: Medium-High (23+ references across 4 database tables)  
**Estimated Duration**: 4-5 hours across 4 phases

---

## 📋 Pre-Migration Analysis

### Database Schema Impact
- **nad_test_ids.customer_id**: `BIGINT(20)` → `VARCHAR(255)` 
- **nad_test_scores.customer_id**: `BIGINT(20)` → `VARCHAR(255)`
- **nad_user_roles.customer_id**: `BIGINT(20)` → `VARCHAR(255)` 
- **nad_user_supplements.customer_id**: `BIGINT(20)` → `VARCHAR(255)`

### Current Usage Patterns
- **Backend**: 15+ API endpoints using customer_id for queries/responses
- **Frontend**: Search and display functionality using customer_id
- **Data Flow**: customer_id used for linking tests, scores, roles, and supplements
- **Authentication**: Will receive email from Shopify Multipass instead of numeric ID

### Multipass Integration
- **Source**: Shopify Multipass will provide customer email addresses
- **Format**: Email strings (e.g., "user@example.com")
- **Authentication Flow**: Multipass → Email extraction → customer_id assignment

---

## 🗂️ Migration Phases

### **Phase 1: Data Audit & Backup Strategy** 
**Duration**: 45 minutes  
**Risk**: Low

#### Tasks:
1. ✅ Create comprehensive audit of all `customer_id` references
2. ✅ Document current data patterns and relationships
3. ✅ Create database backup before changes
4. ✅ Analyze existing customer_id values and distribution
5. ✅ Plan data conversion strategy for existing records
6. ✅ Create rollback plan and procedures

#### Deliverables:
- `/deployment/customer_id_audit.md` - Complete reference documentation
- `/deployment/customer_id_backup.sql` - Database backup with validation
- `/deployment/customer_id_rollback.sql` - Emergency rollback procedures

---

### **Phase 2: Backend Code Updates**
**Duration**: 2 hours  
**Risk**: Medium

#### Tasks:
1. **API Response Updates** (8 endpoints)
   - Update customer_id handling to expect string values
   - Remove any numeric type assumptions
   - Ensure JSON responses handle string customer_ids

2. **Database Query Updates** (12 references)
   - Update SELECT queries for VARCHAR customer_id
   - Update INSERT/UPDATE operations
   - Update WHERE clauses and JOIN conditions

3. **Validation Updates**
   - Add email format validation for customer_id
   - Update customer_id format checks
   - Handle both numeric (legacy) and email (new) formats during transition

4. **Multipass Integration Enhancement**
   - Extract email from Multipass authentication
   - Use email as customer_id in database operations
   - Maintain session handling with email-based customer_id

#### Testing:
- Verify all API endpoints accept string customer_ids
- Test customer_id validation and formatting
- Confirm backward compatibility during transition

---

### **Phase 3: Database Schema Migration**
**Duration**: 1 hour  
**Risk**: Medium-High

#### Tasks:
1. **Pre-Migration Validation**
   ```sql
   -- Backup existing data
   CREATE TABLE customer_id_migration_backup AS 
   SELECT * FROM nad_test_ids;
   
   -- Analyze current customer_id distribution
   SELECT customer_id, COUNT(*) FROM nad_test_ids 
   GROUP BY customer_id ORDER BY COUNT(*) DESC;
   ```

2. **Schema Updates** (4 tables)
   ```sql
   -- nad_test_ids
   ALTER TABLE nad_test_ids 
   MODIFY COLUMN customer_id VARCHAR(255) NULL;
   
   -- nad_test_scores  
   ALTER TABLE nad_test_scores 
   MODIFY COLUMN customer_id VARCHAR(255) NOT NULL;
   
   -- nad_user_roles
   ALTER TABLE nad_user_roles 
   MODIFY COLUMN customer_id VARCHAR(255) NOT NULL;
   
   -- nad_user_supplements
   ALTER TABLE nad_user_supplements 
   MODIFY COLUMN customer_id VARCHAR(255) NOT NULL;
   ```

3. **Index Recreation**
   ```sql
   -- Drop and recreate indexes for VARCHAR performance
   ALTER TABLE nad_test_ids DROP INDEX idx_customer_id;
   ALTER TABLE nad_test_ids ADD INDEX idx_customer_id (customer_id);
   
   -- Update unique constraints
   ALTER TABLE nad_user_roles DROP INDEX customer_id;
   ALTER TABLE nad_user_roles ADD UNIQUE KEY customer_id (customer_id);
   ```

4. **Data Migration Strategy**
   - **Option A**: Keep existing numeric customer_ids as strings
   - **Option B**: Create email mapping for existing customers
   - **Option C**: Reset customer_ids and require re-authentication

#### Testing:
- Verify schema changes applied successfully
- Test index performance with VARCHAR customer_id
- Validate data integrity and relationships

---

### **Phase 4: Frontend Updates & Integration**
**Duration**: 1.5 hours  
**Risk**: Low

#### Tasks:
1. **Search Functionality Updates** (5 files)
   - Remove `.toString()` calls (no longer needed)
   - Update search filters for email format
   - Enhance customer_id display formatting

2. **Display Logic Updates**
   - Update customer_id display to show emails properly
   - Add email formatting and validation
   - Update table column headers if needed

3. **Multipass Authentication Integration**
   - Implement email extraction from Multipass payload
   - Update authentication flow to use email as customer_id
   - Handle session management with email-based identifiers

4. **Testing & Validation**
   - Test complete authentication flow
   - Verify customer_id handling across all interfaces
   - Validate email-based customer identification

---

## 🚨 Risk Assessment & Mitigation

### **High Risk Areas**
- ⚠️ **Database schema changes**: Altering column types on existing data
- ⚠️ **Data type compatibility**: Ensuring numeric→string conversion works
- ⚠️ **Index performance**: VARCHAR indexes vs BIGINT performance impact

### **Medium Risk Areas** 
- ⚠️ **API compatibility**: Existing integrations expecting numeric IDs
- ⚠️ **Authentication flow**: Multipass integration changes
- ⚠️ **Data relationships**: Foreign key constraints across tables

### **Mitigation Strategies**
1. **Comprehensive Backup**: Full database backup before schema changes
2. **Gradual Migration**: Support both formats during transition period
3. **Performance Testing**: Monitor query performance with VARCHAR indexes
4. **Rollback Plan**: Quick restoration procedures ready

---

## 📊 Data Migration Strategy

### **Existing Customer ID Handling**

#### **Option A: Preserve Existing IDs** (Recommended)
- Convert existing numeric customer_ids to strings ("12345" → "12345")
- New customers get email-based customer_ids from Multipass
- Maintain backward compatibility with existing data

#### **Option B: Email Mapping**
- Create mapping table for existing numeric IDs → email addresses
- Migrate existing customers to email-based IDs
- Requires customer email collection/mapping

#### **Option C: Fresh Start**
- Clear existing customer_id references
- Require all customers to re-authenticate via Multipass
- Simplest technically but impacts existing users

### **Recommended Approach: Option A**
```sql
-- Convert existing numeric customer_ids to strings
UPDATE nad_test_ids SET customer_id = CAST(customer_id AS CHAR);
UPDATE nad_test_scores SET customer_id = CAST(customer_id AS CHAR);
UPDATE nad_user_roles SET customer_id = CAST(customer_id AS CHAR);
UPDATE nad_user_supplements SET customer_id = CAST(customer_id AS CHAR);
```

---

## 🧪 Testing Strategy

### **Phase 2 Testing: Backend**
1. **API Endpoint Testing**
   - Test customer_id queries with string values
   - Verify JSON responses format correctly
   - Test both numeric and email customer_id formats

2. **Database Operation Testing**
   - Test INSERT operations with email customer_ids
   - Verify UPDATE/DELETE operations work correctly
   - Test JOIN queries across tables

### **Phase 3 Testing: Database**
1. **Schema Validation**
   - Verify column types changed successfully
   - Test index performance with VARCHAR
   - Validate foreign key relationships maintained

2. **Data Integrity Testing**
   - Verify no data loss during migration
   - Test customer_id uniqueness constraints
   - Validate cross-table relationships

### **Phase 4 Testing: Integration**
1. **Multipass Authentication**
   - Test email extraction from Multipass payload
   - Verify customer_id assignment from email
   - Test complete authentication flow

2. **Frontend Functionality**
   - Test search with email-based customer_ids
   - Verify display formatting works correctly
   - Test all customer_id-related UI features

---

## 🎯 Success Criteria

### **Functional Requirements**
- ✅ All customer_id fields support email addresses (VARCHAR(255))
- ✅ Existing customer data preserved and accessible
- ✅ Multipass authentication provides email as customer_id
- ✅ All API endpoints handle string customer_ids correctly
- ✅ Frontend search and display work with email customer_ids
- ✅ Database performance maintained with new indexes

### **Technical Requirements**
- ✅ Database schema updated across all 4 tables
- ✅ All code references handle VARCHAR customer_id
- ✅ No data loss during migration process
- ✅ Index performance optimized for VARCHAR queries
- ✅ Authentication flow integrated with Multipass emails

---

## 🛠️ Rollback Plan

### **Emergency Rollback Procedure**
1. **Stop Application**: Prevent new data from being written
2. **Restore Database**: 
   ```sql
   DROP TABLE nad_test_ids;
   CREATE TABLE nad_test_ids AS SELECT * FROM customer_id_migration_backup;
   -- Restore other tables similarly
   ```
3. **Restore Code**: Revert to previous commit
4. **Restart Services**: Bring application back online
5. **Verify Functionality**: Test all customer_id operations

### **Partial Rollback Options**
- **Schema Only**: Revert column types, keep code changes
- **Code Only**: Revert code changes, keep schema updates
- **Selective**: Rollback specific tables or components

---

## 📋 Migration Checklist

### **Pre-Migration**
- [ ] Customer_id audit documentation complete
- [ ] Database backup created and verified
- [ ] Rollback procedures tested
- [ ] Team notification sent
- [ ] Maintenance window scheduled

### **Phase 1: Audit & Backup**
- [ ] customer_id_audit.md created
- [ ] Database backup verified working
- [ ] Rollback scripts prepared and tested
- [ ] Current customer_id patterns documented
- [ ] Migration strategy finalized

### **Phase 2: Backend Updates**
- [ ] API endpoints updated for string customer_id
- [ ] Database queries updated for VARCHAR
- [ ] Customer_id validation updated
- [ ] Multipass integration enhanced
- [ ] Backend testing completed

### **Phase 3: Database Migration**
- [ ] Pre-migration validation completed
- [ ] Schema changes applied to all 4 tables
- [ ] Indexes recreated for VARCHAR performance
- [ ] Data integrity verified
- [ ] Performance testing completed

### **Phase 4: Frontend & Integration**
- [ ] Search functionality updated
- [ ] Display logic updated for emails
- [ ] Multipass authentication integrated
- [ ] End-to-end testing completed
- [ ] User acceptance testing passed

### **Post-Migration**
- [ ] All functionality verified working
- [ ] Performance monitoring active
- [ ] Documentation updated
- [ ] Migration marked complete
- [ ] Backup data archived

---

## 🚀 Expected Benefits

### **Authentication Improvements**
- **Seamless Multipass Integration**: Direct email-based customer identification
- **Better User Experience**: Single sign-on with email-based identity
- **Simplified Account Management**: Email as natural customer identifier

### **Data Model Benefits**
- **More Intuitive Data**: Email addresses are human-readable identifiers
- **Better Debugging**: Easier to trace customer issues with email IDs
- **Flexible Architecture**: Support for various authentication providers

### **System Architecture**
- **Cleaner Integration**: Natural fit with Shopify Multipass emails
- **Future-Proof Design**: Support for email-based customer systems
- **Simplified Relationships**: Direct email-based customer linking

---

## ⚠️ Important Considerations

### **Email Validation Requirements**
- **Format Validation**: Ensure customer_id contains valid email format
- **Uniqueness**: Maintain customer_id uniqueness across all tables
- **Case Sensitivity**: Decide on email case handling (lowercase normalization)

### **Performance Considerations**
- **Index Strategy**: VARCHAR indexes may be slower than BIGINT
- **Query Optimization**: Monitor customer_id-based query performance
- **Storage Impact**: VARCHAR(255) uses more storage than BIGINT(20)

### **Security Considerations**
- **PII Handling**: Email addresses are personally identifiable information
- **Data Privacy**: Ensure compliance with privacy regulations
- **Access Logging**: Monitor access to email-based customer data

---

*Migration Plan Created: July 20, 2025*  
*Target: Email-based customer identification via Shopify Multipass*  
*Generated by Claude Code Assistant* 🤖