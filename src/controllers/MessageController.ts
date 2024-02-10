import {Request, Response} from 'express';
import Users from '../models/Users';
import PatternResponses from '../helpers/PatternResponses'
import MessagesModel from '../models/Messages';

export const readMessages = async (req: Request, res: Response)=>{
    const {userIdFrom, userIdTo} = req.body;

    const usersExist = await Users.UsersExist([userIdFrom, userIdTo])
    if(!usersExist){return PatternResponses.Error.noRegister(res)}

    const readMessage = await MessagesModel.ReadMessages(userIdFrom, userIdTo);

    if(!readMessage){return PatternResponses.Error.notUpdated(res)}
    return PatternResponses.Success.updated(res)
}

export const sendMessage = async (req: Request, res: Response)=>{
    const {userIdFrom, userIdTo, messageContent} = req.body;

    console.log(userIdFrom, userIdTo, messageContent)
    const usersExist = await Users.UsersExist([userIdFrom, userIdTo]);
    if(!usersExist){return PatternResponses.Error.noRegister(res)}

    const sendMessage = await MessagesModel.SendMessage(userIdFrom, userIdTo, messageContent)
    
    if(!sendMessage){return PatternResponses.Error.notSent(res)}

    return PatternResponses.Success.sent(res)
}

export const retrieveMessages = async (req: Request, res: Response)=>{
    const {userIdFrom, userIdTo, alreadyRetrievedMessagesIds} = req.body;

    const usersExist = await Users.UsersExist([userIdFrom, userIdTo])
    if(!usersExist){return PatternResponses.Error.noRegister(res)}

    const messages = await MessagesModel.ListMessagesFromUser(userIdFrom, userIdTo, alreadyRetrievedMessagesIds)
    return res.json(messages)
}

export const retrieveChats = async (req: Request, res: Response)=>{
    const {userId} = req.params;

    const userExist = await Users.UsersExist([parseInt(userId)])
    if(!userExist){return PatternResponses.Error.noRegister(res)}

    const chats = await MessagesModel.ListChats(parseInt(userId))

    return res.json(chats)
}