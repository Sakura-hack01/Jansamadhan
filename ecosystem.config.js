/**
 * PM2 Ecosystem File — Production Deployment Config
 * Designed for 1,00,000+ concurrent users
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 scale jansamadhan-api 8  (scale to 8 instances)
 *   pm2 monit                     (monitor all instances)
 */
module.exports = {
  apps: [{
    name: 'jansamadhan-api',
    script: './backend/server.js',
    
    // === CLUSTERING (1 Lakh+ users) ===
    instances: 'max',           // Use all CPU cores
    exec_mode: 'cluster',       // Cluster mode for load balancing
    
    // === MEMORY & RESTART POLICIES ===
    max_memory_restart: '512M', // Auto-restart if > 512MB memory
    max_restarts: 10,           // Max restart attempts
    min_uptime: '10s',          // Min uptime before considered stable
    
    // === ENVIRONMENT ===
    env: {
      NODE_ENV: 'development',
      PORT: 5000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    
    // === LOGGING ===
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    
    // === GRACEFUL SHUTDOWN ===
    kill_timeout: 5000,          // 5 second graceful shutdown
    listen_timeout: 10000,       // Wait 10s for app to be ready
    shutdown_with_message: true,
    
    // === WATCH (development only) ===
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
  }]
};
