import {Request, Response} from 'express';
import Interactions from '../models/Interactions'
import Users from '../models/Users';
import PatternResponses from '../helpers/PatternResponses'
import InteractionsModel from '../models/Interactions';


export const likeUser = async (req: Request, res: Response)=>{
    const {userIdFrom, userIdTo} = req.body;
    const usersExist = await Users.UsersExist([userIdFrom, userIdTo]);

    if(!usersExist){return PatternResponses.Error.noRegister(res);}

    const youLikeUser = await Interactions.LikeFromUsersId(userIdFrom, userIdTo);
    if(youLikeUser){return PatternResponses.Error.alreadyExists(res);}

    const dislikeExists = await Interactions.DislikeFromUsersId(userIdFrom, userIdTo);
    if(dislikeExists){InteractionsModel.DeleteDislike(dislikeExists.id)}
    
    const createInteraction = await Interactions.CreateLikeInteraction(userIdFrom, userIdTo);
    if(!createInteraction){return PatternResponses.Error.notCreated(res, "like interaction");}
    
    const userLikesYou = await Interactions.LikeFromUsersId(userIdTo, userIdFrom);

    return PatternResponses.Success.created(res)
}

export const dislikeUser = async (req: Request, res: Response)=>{
    const {userIdFrom, userIdTo} = req.body;

    console.log('dilike gostoso')
    console.log('teste', userIdFrom, userIdTo)
    const usersExist = await Users.UsersExist([userIdFrom, userIdTo]);
    if(!usersExist){return PatternResponses.Error.noRegister(res);}

    const dislikeExists = await Interactions.DislikeFromUsersId(userIdFrom, userIdTo);
    if(dislikeExists){return PatternResponses.Error.alreadyExists(res)}


    const likeExists = await Interactions.LikeFromUsersId(userIdFrom, userIdTo);
    if(likeExists){InteractionsModel.DeleteLike(likeExists.id)}

    const createInteraction = Interactions.CreateDislikeInteraction(userIdFrom, userIdTo);
    if(!createInteraction){return PatternResponses.Error.notCreated(res, "dislike interaction")}

    return PatternResponses.Success.created(res);
}
