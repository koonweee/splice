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
});
