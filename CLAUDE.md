## Server Configuration
- The remote server has path to the app at /opt/nad-app
- remember that the remote path to code is at /home/bitnami/htdocs/nad-app
- the app on the server is nad-api
- on remote server we use vi instead of nano

## Deployment
- The deployment scenario is in /development/deploy.sh
- There is no remote git repository for this project
- deployment on the server is done with the /deployment/deploy.sh script

## Logging
- remember that we implemented the Pino logging system