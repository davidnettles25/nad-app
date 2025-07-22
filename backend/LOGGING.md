# 📋 NAD+ Lab Interface Logging System

## 🎯 Overview

The NAD+ Lab Interface uses a comprehensive Pino-based logging system with request correlation, customer tracking, and performance monitoring.

## 🏗️ Architecture

### **Log Levels**
- `fatal` - Critical system failures
- `error` - Application errors requiring attention
- `warn` - Warning conditions that should be monitored  
- `info` - General operational messages
- `debug` - Detailed debugging information
- `trace` - Very detailed tracing information

### **Log Files**
- `app.log` - General application logs
- `api.log` - API request/response logs
- `error.log` - Error-specific logs with full context
- `customer.log` - Customer activity tracking
- `admin.log` - Admin interface operations

### **Debug Areas**
- `analytics` - Analytics data processing
- `supplements` - Supplement management
- `batch-printing` - Batch printing operations
- `exports` - Data export functionality

## 🔧 Configuration

### **Runtime Configuration**
Configure logging through the admin interface:
- **Log Level**: Set minimum log level
- **File Outputs**: Enable/disable specific log files
- **Debug Areas**: Enable targeted debug logging
- **Console Logging**: Enable for development

### **Retention Policy**
- **Default**: 30 days retention
- **Cleanup**: Automatic daily cleanup
- **Size Limits**: 1GB total log storage

## 📊 Request Correlation

Every request gets a unique ID for tracing:

```json
{
  "requestId": "uuid-123456", 
  "endpoint": "/api/tests/verify",
  "duration": "45ms",
  "statusCode": 200
}
```

### **Response Headers**
- `X-Request-ID`: Unique request identifier
- `X-Response-Time`: Request processing time

## 👥 Customer Tracking

Customer actions are tracked with email correlation:

```json
{
  "customerId": "customer@email.com",
  "testId": "NAD123456", 
  "action": "test_verification",
  "type": "customer"
}
```

## 🐛 Debug Logging

Enable debug logging for specific areas:

```javascript
// Analytics debug logging
req.logger.debugArea('analytics', 'Query completed', {
  totalTests: 78,
  averageScore: 65.4
});

// Supplements debug logging  
req.logger.debugArea('supplements', 'Categories loaded', {
  categories: ['NAD+', 'Antioxidants'],
  activeCount: 12
});
```

## ⚡ Performance Monitoring

### **Slow Request Detection**
Requests >1000ms are flagged:

```json
{
  "level": "warn",
  "message": "Slow request detected",
  "endpoint": "GET /api/analytics/overview", 
  "duration": "1250ms",
  "threshold": "1000ms"
}
```

### **Response Size Tracking**
Large responses are monitored:

```json
{
  "responseSize": 15420,
  "endpoint": "/api/supplements",
  "compressionRatio": 0.65
}
```

## 🔐 Best Practices

### **Logging Do's**
✅ Use appropriate log levels
✅ Include request context
✅ Provide structured data
✅ Use debug areas for module-specific logging
✅ Include timing information
✅ Add customer correlation where applicable

### **Logging Don'ts**
❌ Log sensitive data (passwords, API keys)
❌ Use console.log directly
❌ Log excessive debug data in production
❌ Skip error context and stack traces
❌ Use string concatenation for log messages

### **Error Logging Template**
```javascript
req.logger.error('Operation failed', {
  endpoint: req.path,
  operation: 'database_query',
  error: error.message,
  stack: error.stack,
  context: { userId, testId }
});
```

### **Customer Activity Template**
```javascript
req.logger.customer('test_activation', email, testId, {
  previousStatus: 'pending',
  newStatus: 'activated',
  supplements: supplementData
});
```

## 📈 Monitoring & Alerts

### **Key Metrics to Monitor**
- Request volume and response times
- Error rates by endpoint
- Customer activity patterns
- Slow query frequency
- Log file growth rates

### **Alert Thresholds**
- **Error Rate**: >5% for any endpoint
- **Response Time**: >2000ms average
- **Log Volume**: >100MB/day growth
- **Failed Requests**: >10/hour

## 🛠️ Troubleshooting

### **Common Issues**

**1. Missing Log Files**
- Check log directory permissions
- Verify log configuration in admin interface
- Ensure Pino dependencies are installed

**2. No Request Correlation**
- Verify middleware is loaded before routes
- Check request ID generation
- Confirm response headers are set

**3. Debug Logs Not Appearing**
- Set log level to 'debug'
- Enable specific debug areas
- Check debug area configuration

**4. Performance Issues**
- Monitor log file sizes
- Enable log rotation
- Check retention policies

### **Log Analysis Commands**

```bash
# View recent errors
tail -f /opt/nad-app/logs/error.log | jq '.'

# Search by request ID
grep "uuid-123456" /opt/nad-app/logs/*.log

# Monitor slow requests
tail -f /opt/nad-app/logs/api.log | grep "Slow request"

# Customer activity tracking
tail -f /opt/nad-app/logs/customer.log | jq '.customerId'
```

## 🔄 Maintenance

### **Daily Tasks** (Automated)
- Log cleanup based on retention policy
- Performance metric collection
- Error rate analysis

### **Weekly Tasks** (Manual)
- Review slow request patterns
- Analyze customer activity trends  
- Check log storage usage
- Update debug area configurations

### **Monthly Tasks** (Manual)
- Review retention policies
- Optimize log queries
- Update monitoring thresholds
- Performance tuning based on metrics

---

## 📞 Support

For logging system issues:
1. Check admin interface log configuration
2. Review PM2 logs: `pm2 logs nad-api`
3. Verify log file permissions
4. Test endpoints with request correlation
5. Monitor performance metrics in real-time

**The logging system provides complete observability into NAD+ Lab Interface operations with customer correlation, performance monitoring, and comprehensive error tracking.**