import { Request, Response, NextFunction } from "express";
import passport from "passport";
import dotenv from 'dotenv';
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
import jwt from 'jsonwebtoken';
import crypto from 'crypto'
import UsersModel from "../models/Users";

dotenv.config();

const notAuthorizedJson = {status: 401, message: "Not Authorized"}
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWTPASS as string
}

passport.use(new JWTStrategy(options, async (payload, done)=>{
    const user = await UsersModel.findByPk(payload.id);
    if(user){
        return done(null, user)
    }

    return done(notAuthorizedJson, false)
}));

export const privateRoute = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', (err: Error, user: UsersModel) => {
        if (err) {
            console.error(err);
            return next(err);
        }
        if (!user) {
            return next(notAuthorizedJson);
        }
        req.user = user;
        return next();
    })(req, res, next);
}

export const generateToken = (data: object)=>{
    return jwt.sign(data, process.env.JWTPASS as string)
}

export const decodeToken = (token: string) => {
    try {
      const decodedData = jwt.verify(token, process.env.JWTPASS as string);
      console.log(decodedData)
      return decodedData;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

export const generateHash = (inputString: string, hashAlgorithm = 'sha256')=>{
    const hash = crypto.createHash(hashAlgorithm);
    hash.update(inputString, 'utf-8');
    return hash.digest('hex');
  }

export default passport