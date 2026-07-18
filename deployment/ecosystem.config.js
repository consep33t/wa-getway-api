module.exports = {
  apps: [{
    name: 'wa-gateway-api',
    script: './src/index.js',
    instances: 1, // Wajib 1 instance untuk whatsapp-web.js (menghindari session conflict)
    autorestart: true,
    watch: false,
    max_memory_restart: '1G', // Mencegah memory leak dari Puppeteer
    exp_backoff_restart_delay: 100, // Menghindari restart loop
    env: {
      NODE_ENV: 'development',
      PORT: 3333 // Diubah ke 3333 untuk menghindari bentrok dengan React (3000/5173) atau Golang
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3333
    }
  }]
};
