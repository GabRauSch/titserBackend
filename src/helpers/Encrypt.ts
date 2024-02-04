import dotenv from 'dotenv'
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

dotenv.config();


export const generateToken = (data: object)=>{
    return jwt.sign(data, process.env.JWTPASS as string)
}
export const getLocationFromToken = (token: string)=>{
    const decoded = jwt.verify(token, process.env.JWTPASS as string);
    const latitude = (decoded as any)?.latitude
    const longitude = (decoded as any)?.longitude

    const location = {latitude, longitude}
    console.log(location);
    return location
}

export const generateHash = (password: string, name: string, hashAlgorithm = 'sha256')=>{
    const hash = crypto.createHash(hashAlgorithm);
    hash.update(password + name, 'utf-8');
    return hash.digest('hex');
  }
