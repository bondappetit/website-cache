import dotenv from 'dotenv';
dotenv.config();

export default {
  container: {
    webServer: {
      port: parseInt(process.env.WEBSERVER_PORT ?? '8080', 10),
    },
    database: {
      host: process.env.DATABASE_HOST ?? '',
      user: process.env.DATABASE_USER ?? '',
      password: process.env.DATABASE_PASSWORD ?? '',
      database: process.env.DATABASE_NAME ?? '',
    },
    ethereum: {
      host: process.env.ETH_NODE ?? '',
    },
  },
};
