module.exports = {
  apps: [
    {
      name: 'cheque-backend',
      cwd: './cheque-backend',
      script: 'dist/src/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'cheque-frontend',
      cwd: './cheque-frontend',
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};