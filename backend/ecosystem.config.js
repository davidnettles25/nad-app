module.exports = {
  apps: [{
    name: 'nad-api',
    script: 'server.js',
    cwd: '/opt/nad-app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/opt/nad-app/logs/err.log',
    out_file: '/opt/nad-app/logs/out.log',
    log_file: '/opt/nad-app/logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};