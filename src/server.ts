import app from './app';
import dotenv from 'dotenv';
import { findLocation } from './config/location';

dotenv.config();

app.listen(process.env.PORT, ()=>{})