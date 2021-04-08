import dotenv from 'dotenv';
dotenv.config();

export default {
  container: {
    webServer: {
      port: 8080,
    },
    database: {
      user: process.env.DATABASE_USER ?? '',
      password: process.env.DATABASE_PASSWORD ?? '',
      database: 'bondappetit',
    },
    ethereum: {
      host: process.env.ETH_NODE ?? ''
    },
  },
};
