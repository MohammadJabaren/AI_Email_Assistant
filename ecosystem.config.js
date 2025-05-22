module.exports = {
  apps: [{
    name: 'next-app',
    script: 'npm',
    args: 'start',
    env: {
      PORT: 3000,
      HOST: '0.0.0.0',
      NODE_ENV: 'production'
    }
  }]
} 