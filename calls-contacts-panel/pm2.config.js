module.exports = {
  name: 'callpanel',
  script: './build/src/main.js',
  args: 'run-as-service',
  env: {
    NODE_ENV: "production"
  },
  wait_ready: true,
  min_uptime: 10000,
  max_restarts: 10,
}