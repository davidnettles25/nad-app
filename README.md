# NAD Test Cycle Application

Complete modular web application for NAD+ cellular energy testing workflow.

## 🏗️ Project Structure

```
nad-app/
├── backend/          # Node.js API server
├── frontend/         # Web interface files
├── deployment/       # Deploy scripts
└── docs/            # Documentation
```

## 🚀 Development Workflow

### Frontend Development
```bash
# Edit frontend files
vi frontend/admin/js/sections/supplements.js
vi frontend/shared/css/base.css

# Commit changes
git add frontend/
git commit -m "Fix supplement functionality"
git push origin main
```

### Backend Development
```bash
# Edit backend files
vi backend/server.js
vi backend/routes/supplements.js

# Commit changes
git add backend/
git commit -m "Add new API endpoints"
git push origin main
```

### Deploy to Production
```bash
# Single command deploys both frontend and backend
./deployment/deploy.sh
```

## 🔗 Production URLs

- **Frontend**: https://mynadtest.info/nad-app/
- **Admin Dashboard**: https://mynadtest.info/nad-app/admin-dashboard.html
- **API**: https://mynadtest.info/
- **API Health**: https://mynadtest.info/health

## 📂 Production Deployment Structure

- Backend files deploy to: `/opt/nad-app/`
- Frontend files deploy to: `/home/bitnami/htdocs/nad-app/`

## 🛠️ Development Setup

1. Clone repository: `git clone https://github.com/davidnettles25/nad-app.git`
2. Work on files in `frontend/` and `backend/` directories
3. Test changes: `./deployment/deploy.sh`
4. Commit and push to GitHub

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Frontend Structure](docs/FRONTEND.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
