// import { Request, Response, NextFunction } from "express";
// import passport from "passport";
// import dotenv from 'dotenv';
// import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
// import jwt from 'jsonwebtoken';
// import crypto from 'crypto'

// dotenv.config();

// const notAuthorizedJson = {status: 401, message: "Not Authorized"}
// const options = {
//     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//     secretOrKey: process.env.JWTPASS as string
// }
// passport.use(new JWTStrategy(options, async (payload, done)=>{
//     const user = await UserModel.findByPk(payload.id);
//     if(user){
//         return done(null, user)
//     }

//     return done(notAuthorizedJson, false)
// }));

// export const privateRoute = (req: Request, res: Response, next: NextFunction)=>{
//     passport.authenticate('jwt', (err: object, user: UserModel)=>{
//         req.user = user;
//         return (user) ? next() : next(notAuthorizedJson) 
//     })(req, res, next)
// }

// export const exclusiveAdminRoute = (req: Request, res: Response, next: NextFunction) => {
//     passport.authenticate('jwt', (err: object, user: UserModel) => {
//       if (user.role === 'admin') {
//           req.user = user;
//           return next();
//         } 
//         return next(notAuthorizedJson);
//     })(req, res, next);
// };

// export const generateToken = (data: object)=>{
//     return jwt.sign(data, process.env.JWTPASS as string)
// }

// export const generateHash = (inputString: string, hashAlgorithm = 'sha256')=>{
//     const hash = crypto.createHash(hashAlgorithm);
//     hash.update(inputString, 'utf-8');
//     return hash.digest('hex');
//   }

// export default passport