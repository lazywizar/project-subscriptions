import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'postgres',
  password: process.env.DB_PASSWORD || 'buddy',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
};