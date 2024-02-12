import {Request, Response} from 'express';
import Interactions from '../models/Interactions'
import Users, { FullRetrieveData, UsersAttributes } from '../models/Users';
import PatternResponses from '../helpers/PatternResponses'
import { UserUpdateData } from '../types/UserData';
import fs from 'fs';
import path from 'path'
import {v4 as uuidv4} from 'uuid';
import Jimp from 'jimp';
import { FullRetrieveSchema } from '../helpers/schemas';
import UsersModel from '../models/Users';
import { decodeToken, generateHash } from '../config/passport';
import { Gender, isGender } from '../types/Genders';

export const setLocationByLatitudeAndLongitude = async (req: Request, res: Response)=>{
    const {userId, location} = req.body;

    const user = await Users.findByPk(userId);

    if(!user){return PatternResponses.Error.noRegister(res);}

    const setLocation = await Users.SetUserCurrentLocation(user.id, location)
    if(!setLocation){return PatternResponses.Error.notUpdated(res)}
    
    return PatternResponses.Success.updated(res)
}
export const getUsersThatLikedYou = async (req: Request, res: Response)=>{
  const {userIdTo, alreadyRetrievedIds} = req.body;

  const users = await Users.GetUsersThatLiked(userIdTo, alreadyRetrievedIds)

  return res.json(users)
}
export const getUserLikes = async (req: Request, res: Response)=>{
  const {userIdFrom, alreadyRetrievedIds} = req.body;

  const users = await Users.GetUserLikes(userIdFrom, alreadyRetrievedIds);

  return res.json(users)
}

export const getUsersThatYouDisliked = async (req: Request, res: Response)=>{
  const {userIdFrom, alreadyRetrievedIds} = req.body;

  const users = await Users.GetUsersThatYouDisliked(userIdFrom, alreadyRetrievedIds);

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
export const retrieveUserInfo = async (req: Request, res: Response)=>{
  const {userId} = req.params

  if(!userId){
    return PatternResponses.Error.missingAttributes(res, 'userId')
  }

  const user = await UsersModel.GetUserInfo(parseInt(userId))
  if(!user){
    return PatternResponses.Error.noRegister(res)
  }
  return res.json(user)
}
export const setUserImage = async (req: Request, res: Response) => {
    const { userId } = req.body;
    const file = req.file;
    
    if(file == undefined || userId == undefined){
      return PatternResponses.Error.missingAttributes(res, 'userId, file')
    }
    const user = await Users.findByPk(userId);
    if(!user) return PatternResponses.Error.noRegister(res)

    if (!file) return PatternResponses.Error.missingAttributes(res, 'photo');
  
    const fileName = `${uuidv4()}.png`;
    const outputPath = path.join(__dirname, '../../public/images', fileName);
  
    const maxWidth = 240; 
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
    const {userId, customName, description, birthday, gender, targetAgeRange, targetDistanceRange, targetGender} = req.body;

    const userExist = await Users.findByPk(userId);
    if(!userExist){return PatternResponses.Error.noRegister(res)}

    console.log(birthday)

    const data: UserUpdateData = {};
    if (customName) data.customName = customName.substring(0, 12)
    if(description) data.description = description.substring(0, 55)
    if(birthday) {
      const parts = birthday.split('/');
      data.birthday = new Date(parts[2], parts[0], parts[1])
    } 
    if(gender && isGender(gender))  data.gender = gender
    if(targetDistanceRange && parseInt(targetDistanceRange)) data.targetDistanceRange = parseInt(targetDistanceRange)
    if(targetGender && isGender(targetGender))  data.targetGender = targetGender
    if(targetAgeRange) {
      const targetAgeRangeArray = targetAgeRange.split(`-`);
      data.targetAgeRange = `[${targetAgeRangeArray.join()}]`
    } 

    console.log(data)
    const updateUser = await Users.UpdateUserInfo(userId, data);
    if(!updateUser){
      return PatternResponses.Error.notUpdated(res)
    }

    return PatternResponses.Success.updated(res, undefined, data)
}


export const findUsersThatMatched = async (req: Request, res: Response)=>{
  const {userId} = req.params;

  const userExist = await Users.findByPk(parseInt(userId));
  if(!userExist){
      return PatternResponses.Error.noRegister(res)
  }

  const matches = await Users.findMatches(parseInt(userId));

  return res.json(matches)
}
