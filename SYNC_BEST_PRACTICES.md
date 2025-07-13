# NAD Sync Management - Best Practices Guide

## 🎯 The Golden Rule: **Always Commit Before Deploy**

```bash
# ✅ CORRECT Workflow:
git add .
git commit -m "Describe your changes"
git push origin main
./deploy.sh

# ❌ WRONG Workflow:
./deploy.sh  # Deploy uncommitted changes
# (Creates immediate sync problem)
```

## 🔄 Common Scenarios & Solutions

### Scenario 1: Normal Development
```bash
# 1. Make changes locally
# 2. Test changes
# 3. Commit first
git add .
git commit -m "Add new feature"
git push origin main

# 4. Then deploy
./deploy.sh
```

### Scenario 2: Emergency Restore
```bash
# 1. Restore immediately (sync will break)
./restore_sync_aware.sh 20250113_143022

# 2. Test restored version
# 3a. If keeping restored version:
#     Download files → commit to repo
# 3b. If discarding restored version:
./deploy.sh  # Re-sync with repo
```

### Scenario 3: Testing an Old Backup
```bash
# 1. Note current state
./check_sync.sh

# 2. Restore for testing
./restore_sync_aware.sh 20250113_143022

# 3. Test the old version
# 4. Return to current state
./deploy.sh  # This restores repo sync
```

### Scenario 4: Fixing Sync Problems
```bash
# Check current sync status
./check_sync.sh

# If out of sync, choose:
# Option A: Deploy repo version
./deploy.sh

# Option B: Commit deployment version
# Download current deployment files
# git add . && git commit -m "Sync deployment to repo"
# git push origin main
```

## 🛠️ Available Tools

### `check_sync.sh`
- Checks if repo and deployment match
- Shows sync status and recommendations
- Run anytime to check current state

### `restore_sync_aware.sh`
- Restores from backup with sync warnings
- Creates pre-restore backup automatically
- Provides clear post-restore instructions

### `deploy.sh` (existing)
- Deploys latest code from repository
- Always creates backup before deployment
- Maintains sync by design

## 🚨 Warning Signs of Sync Problems

- Manual file edits on server
- Restoring from backups
- Deploying uncommitted changes
- Copying files directly to server

## ✅ Good Practices

1. **Always commit before deploying**
2. **Use `check_sync.sh` regularly**
3. **Test in development environment first**
4. **Document any manual changes**
5. **Resolve sync issues immediately**

## 📞 Troubleshooting

**Problem**: "I made changes on the server directly"
**Solution**: Download the changes and commit them to repo

**Problem**: "I restored a backup and now things are broken"
**Solution**: Run `./deploy.sh` to restore from repo

**Problem**: "I don't know if I'm in sync"
**Solution**: Run `./check_sync.sh`

**Problem**: "I deployed but my changes aren't there"
**Solution**: Check if you committed and pushed your changes first
