/** Gets various config values from environment variables */
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  bitwarden: {
    accessToken: process.env.BITWARDEN_SECRETS_MANAGER_ACCESS_TOKEN,
    secrets: {
      dbs: process.env.DBS_SECRET_UUID,
    },
  },
});
