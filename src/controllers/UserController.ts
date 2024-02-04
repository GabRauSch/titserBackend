import {Request, Response} from 'express';
import Interactions from '../models/Interactions'
import Users, { FullRetrieveData } from '../models/Users';
import PatternResponses from '../helpers/PatternResponses'
import { UserUpdateData } from '../types/UserData';
import imageMagic from 'imagemagick';
import fs from 'fs';
import path from 'path'
import {v4 as uuidv4} from 'uuid';
import gm from 'gm'
import { createCanvas, loadImage } from 'canvas';
import Jimp from 'jimp';
import Joi, { valid } from 'joi'
import { FullRetrieveSchema } from '../helpers/schemas';

export const setLocationByLatitudeAndLongitude = async (req: Request, res: Response)=>{
    const {userId, location} = req.body;
    console.log(userId, location)

    const user = await Users.findByPk(userId);

    if(!user){return PatternResponses.Error.noRegister(res);}

    const setLocation = await Users.SetUserCurrentLocation(user.id, location)
    if(!setLocation){return PatternResponses.Error.notUpdated(res)}
    
    return PatternResponses.Success.updated(res)
}
export const getUsersThatLikedYou = async (req: Request, res: Response)=>{
  const {userId} = req.params;

  const users = await Users.GetUsersThatLiked(parseInt(userId))

  return res.json(users)
}
export const getUserLikes = async (req: Request, res: Response)=>{
  const {userId} = req.params;

  const users = await Users.GetUserLikes(parseInt(userId));

  return res.json(users)
}

export const getUsersThatYouDisliked = async (req: Request, res: Response)=>{
  const {userId} = req.params;

  const users = await Users.GetUsersThatYouDisliked(parseInt(userId));

  return res.json(users)
}
export const getUserByLocation = async (req: Request, res: Response)=>{
    const {location} = req.body;

    const user = await Users.GetUserByLocationRange(location, 30000)

    return res.json(user)
}

export const getUsersByAgeRange = async (req: Request, res: Response)=>{
    const {minAge, maxAge} = req.params;
    
    const user = await Users.GetUserByAgeRange(parseInt(minAge), parseInt(maxAge));

    return res.json(user);
}

export const getUserLIst = async (req: Request, res: Response)=>{
    const {userId, location, gender, ageRange, rangeInMeters, idsRetrieved} = req.body;

    const validationResult = FullRetrieveSchema.validate(req.body);
    if(validationResult.error){
      const errorMessage = validationResult.error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ error: `Invalid request body. ${errorMessage}` });
    }

    const data: FullRetrieveData = {
        userId, location, gender, ageRange, rangeInMeters, idsRetrieved
    }

    const users = await Users.RetrieveUsersList(data);
    
    return res.json(users)
}

export const setUserImage = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const file = req.file;
  
    const user = await Users.findByPk(userId);
    if(!user) return PatternResponses.Error.noRegister(res)

    if (!file) return PatternResponses.Error.missingAttributes(res, 'photo');
  
    const fileName = `${uuidv4()}.png`;
    const outputPath = path.join(__dirname, '../../public/images', fileName);
  
    const maxWidth = 230; 
    const maxHeight = 300;
  
    const image = await Jimp.read(file.path);
  
    if (!image)  return PatternResponses.Error.internalServerError(res) 
  
    image.cover(maxWidth, maxHeight);
  
    await image.writeAsync(outputPath);
    await fs.unlink(file.path, res=>console.log(res));
  
    const setImage = await Users.setUserImage(userId, fileName);
  
    if (!setImage) {
      fs.unlink(outputPath, (res)=>{console.log(res)})
      return PatternResponses.Error.imageNotUploaded(res)
    } 

    if(user.photo){
      const oldPath = path.join(__dirname, '../../public/images', user.photo);
      fs.unlink(oldPath, res=>console.log(res))
    }
    return PatternResponses.Success.imageUploaded(res)
  } catch (error) {
    return PatternResponses.Error.internalServerError(res)
  }
};

export const setUserName = async (req: Request, res: Response)=>{
    const {userId, customName} = req.body;

    const userExist = await Users.findByPk(userId);
    if(!userExist){return PatternResponses.Error.noRegister(res)}

    const update = await Users.setUserName(userId, customName);

    if(!update){return PatternResponses.Error.notUpdated(res)}

    return PatternResponses.Success.updated(res)
}

export const updateUserInfo = async (req: Request, res: Response)=>{
    const {userId, customName, description, photo} = req.body;

    const userExist = await Users.findByPk(userId);
    if(!userExist){return PatternResponses.Error.noRegister(res)}

    const data: UserUpdateData = {};
    customName ? data.customName = customName : null;
    description ? data.description = description : null;
    photo ? data.photo = photo : null

    const updateUser = await Users.UpdateUserInfo(userId, data);
    return PatternResponses.Success.updated(res, undefined, data)
}