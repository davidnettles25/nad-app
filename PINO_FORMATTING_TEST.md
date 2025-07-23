# Pino-Pretty Formatting Test Guide

## 🔄 Step 1: Restart the Server
The server must be restarted to pick up the new formatting code.

### Production Server Restart:
```bash
# SSH to your server and run:
sudo systemctl restart nad-app
# OR
pm2 restart nad-app
# OR
sudo service nad-app restart
```

## ✅ Step 2: Verify Server Has New Code

### Test Endpoint 1 - Server Status:
Visit: `https://mynadtest.info/api/admin/server-status`

**Expected Response:**
```json
{
  "success": true,
  "serverStartTime": "2025-01-23T...",
  "pinoFormattingEnabled": true,
  "version": "v2.0-pino-formatting",
  "message": "Server has pino-pretty formatting enabled"
}
```

### Test Endpoint 2 - Formatting Logic:
Visit: `https://mynadtest.info/api/admin/test-pino-format`

**Expected Response:** Should show formatted log instead of JSON

## 🔍 Step 3: Check Server Console Logs
After restart, you should see:
```
🚀 Starting NAD server with pino-pretty formatting enabled...
📅 Server start time: 2025-01-23T...
✅ NAD Server started successfully with pino-pretty formatting!
```

## 📋 Step 4: Test Log Viewing
1. Go to Admin → Log Management
2. Click "View" on any log file
3. Check browser console (F12) for debug info
4. Server console should show: `Log file admin.log: X lines read, Y formatted`

## 🚨 Troubleshooting

### If No Console Output:
- Server hasn't been restarted yet
- Check server status endpoint first

### If Formatting Still Not Working:
- Check browser console for debug info
- Server console will show what format logs are in
- Test endpoints will verify if formatting logic works

### Common Issues:
1. **Server not restarted** - Most common issue
2. **Logs not in Pino JSON format** - Some logs might be plain text
3. **Process manager caching** - May need to restart service manager

## 📞 Quick Test Commands
```bash
# Test server status
curl https://mynadtest.info/api/admin/server-status

# Test formatting logic  
curl https://mynadtest.info/api/admin/test-pino-format
```