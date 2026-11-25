module.exports = {
  apps: [{
    name: "jansamadhan-api",
    script: "./server.js",
    instances: "max", // Utilize all CPU cores for clustering
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
