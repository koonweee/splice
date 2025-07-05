/** Gets various config values from environment variables */
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  postgres: {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
  },
  apiStoreEncryptionKey: process.env.API_STORE_ENCRYPTION_KEY,
});
