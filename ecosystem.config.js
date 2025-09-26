module.exports = {
  apps: [
    {
      name: 'interferencia-api',
      script: 'app.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        CERT_CRT: 'certs/webapp.corpico.com.ar.crt',
        CERT_KEY: 'certs/webapp.corpico.com.ar.key',
        NAS_DOCUMENTOS: 'I:\\Documentos',
        NAS_MAPAS: 'I:\\Mapas'
      }
    }
  ]
};