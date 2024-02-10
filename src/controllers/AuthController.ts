import {Request, Response } from 'express';
import PatternResponses from '../helpers/PatternResponses'
import { generateToken, generateHash } from '../config/passport';
import { sendEmail } from '../config/email';
import UsersModel from '../models/Users';

export const checkEmailAvailability = async (req: Request, res: Response)=>{
    const {email} = req.body;
    
    const userExists = await UsersModel.UserByEmail(email);
    if(userExists && userExists.customName !== null){
        return PatternResponses.Error.alreadyExists(res)
    }
    
    return res.json({message: 'Email available'})
}

export const register = async (req: Request, res: Response)=>{
    const {email, password, customName} = req.body;

    const nameIsTaken = await UsersModel.UserByCustomName(customName);
    if(nameIsTaken){
        console.log('name is taken')
        return PatternResponses.Error.alreadyExists(res)
    }

    const userExists = await UsersModel.UserByEmail(email);
    if(userExists && userExists.customName !== null){
        console.log('user exists')
        return PatternResponses.Error.alreadyExists(res)
    }
    
    const passwordHash = generateHash(password)
    const confirmationCode = generateHash(`${customName}:${new Date().getMilliseconds()}`);
    if(userExists && userExists.customName == null){
        const updateUser = await UsersModel.update(
            {confirmationCode},
            {
                where: {
                    email
                }
            }
        )
        sendEmail({
            senderName: "Confirmation email",
            title: `Confirm signup attempt to user ${customName}`,
            content: confirmationCode,
            receiver: email
        })
        return res.json({
            message: "Temporary user already exists, Token has been resent",
            token: confirmationCode
        })
    }

    const userCreationId = await UsersModel.CreateTemporaryUser(email, passwordHash, confirmationCode)
    if(!userCreationId){
        return PatternResponses.Error.notCreated(res, 'user')
    }
    
    sendEmail({
        senderName: "Confirmation email",
        title: `Confirm signup attempt to user ${customName}`,
        content: confirmationCode,
        receiver: email
    })
    const token = generateToken({id: userCreationId})
    return res.json({
        message: "Temporary User created",
        confirmationCode,
        token
    })
}

export const registerConfirmation = async (req: Request, res: Response)=>{
    const {userToken, customName} = req.body;

    if(!userToken || !customName){
        return PatternResponses.Error.missingAttributes(res, 'userToken, custom name')
    }
    const nameIsTaken = await UsersModel.UserByCustomName(customName);
    if(nameIsTaken){
        console.log('name is taken')
        return PatternResponses.Error.alreadyExists(res)
    }

    const user = await UsersModel.UsersByConfirmationCode(userToken)
    console.log(user)
    if(!user){
        return PatternResponses.Error.noRegister(res)
    }

    const updatedUser = await UsersModel.ConfirmCreation(user, customName);
    if(!updatedUser){
        return PatternResponses.Error.notUpdated(res)
    }
    
    return res.json(updatedUser)
}

export const login = async (req: Request, res: Response)=>{
    const {email, password} = req.body;
    if(!email || !password){
        return PatternResponses.Error.missingAttributes(res, 'email, password')
    }

    const passwordHash = generateHash(password)

    const user = await UsersModel.GetUserByEmailAndPasswordHash(email, passwordHash);
    
    if(!user){
        return PatternResponses.Error.noRegister(res)
    }
    if(user?.customName == null){
        return res.json({error: "Temporary user cannot be logged in"})
    }
    const token = generateToken({id: user.id});
    return res.json({
        token
    })
}