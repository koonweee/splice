/** Gets various config values from environment variables */
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  bitwarden: {
    secrets: {
      dbs: process.env.DBS_SECRET_UUID,
    },
  },
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  apiStoreEncryptionKey: process.env.API_STORE_ENCRYPTION_KEY,
});
