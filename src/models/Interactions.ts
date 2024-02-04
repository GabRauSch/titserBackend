import { DataTypes, Model, Optional, where } from "sequelize";
import sequelize from "../config/mysql";
import UsersModel from "./Users";
import { Op } from "sequelize";

export interface InteractionsAttributes {
    id: number,
    interactionType: string,
    userIdFrom: number,
    userIdTo: number,
    interactionTime: number,
    matched: boolean
}
interface InteractionsCreateAttributes extends Optional<InteractionsAttributes, 'id'>{};

class InteractionsModel extends Model<InteractionsAttributes, InteractionsCreateAttributes> implements InteractionsAttributes{
    public id!: number;
    public interactionType!: string;
    public userIdFrom!: number;
    public userIdTo!: number;
    public interactionTime!: number;
    public matched!: boolean;

    static async MatchInteraction(usersIds: number[]): Promise<boolean>{
        try {
            const match = await InteractionsModel.update({
                matched: true
            }, {
                where: {
                    [Op.or]: [
                        {userIdFrom: usersIds[0], userIdTo: usersIds[1]},
                        {userIdFrom: usersIds[1], userIdTo: usersIds[0]}
                    ]
                }
            })

            return match ? true : false
        } catch (e) {
            console.error(e);
            return false
        }
    }
    static async RemoveMatch(usersIds: number[]): Promise<boolean>{
        try {
            const match = await InteractionsModel.update({
                matched: false
            }, {
                where: {
                    [Op.or]: [
                        {userIdFrom: usersIds[0], userIdTo: usersIds[1]},
                        {userIdFrom: usersIds[1], userIdTo: usersIds[0]}
                    ]
                }
            })

            return match ? true : false
        } catch (e) {
            console.error(e);
            return false
        }
    }


    static async CreateLikeInteraction(userIdFrom: number, userIdTo: number): Promise<Boolean>{
        try{
            const timestamp = new Date().getTime();
            const createLikeInteraction = await InteractionsModel.create({
                interactionType: 'like', 
                userIdFrom,
                userIdTo,
                interactionTime: timestamp,
                matched: false
            })

            const userLikesYou = await InteractionsModel.LikeFromUsersId(userIdTo, userIdFrom);
            if(userLikesYou){
                InteractionsModel.MatchInteraction([userIdFrom, userIdTo]);
            }

            return createLikeInteraction ? true : false
        } catch(e){
            console.error(e);
            return false;
        }
    }

    static async CreateDislikeInteraction(userIdFrom: number, userIdTo: number): Promise<InteractionsModel | null>{
        try{
            console.log('disliking', userIdFrom, userIdTo)
            const youLikedBefore = await InteractionsModel.findAll({
                where: {userIdFrom, userIdTo},
                attributes: {
                    include: ['matched']
                }
            }) 

            if(youLikedBefore){
                InteractionsModel.RemoveMatch([userIdFrom, userIdTo])
            }
            
            const timestamp = new Date().getTime();
            const createDislikeInteraction = await InteractionsModel.create({
                interactionType: 'dislike', 
                userIdFrom,
                userIdTo,
                interactionTime: timestamp,
                matched: false
            })

            return createDislikeInteraction
        } catch(e){
            console.error(e);
            return null;
        }
    }
    static async DislikeFromUsersId(userIdFrom: number, userIdTo: number): Promise<InteractionsModel | null>{
        try{
            const dislike = await InteractionsModel.findOne({
                where: {
                    interactionType: 'dislike',
                    userIdFrom,
                    userIdTo
                }
            })

            return dislike 
        } catch(e){
            console.error(e);
            return null;
        }
    }
    static async LikeFromUserToId(userIdTo: number): Promise<InteractionsModel | null>{
        try{
            const like = await InteractionsModel.findOne({
                where: {
                    userIdTo,
                }
            })

            return like 
        } catch(e){
            console.error(e);
            return null;
        }
    }
    static async LikeFromUsersId(userIdFrom: number, userIdTo: number): Promise<InteractionsModel | null>{
        try{
            const like = await InteractionsModel.findOne({
                where: {
                    interactionType: 'like',
                    userIdFrom,
                    userIdTo
                }
            })

            return like 
        } catch(e){
            console.error(e);
            return null;
        }
    }
    static async DeleteDislike(dislikeId: number): Promise<Boolean>{
        try {
            const dislikeDeletion = await InteractionsModel.destroy({
                where: {
                    id: dislikeId
                }
            })
            return dislikeDeletion ? true : false
        } catch (e) {
            console.error(e);
            return false
        }
    }
    static async DeleteLike(likeId: number): Promise<Boolean>{
        try {
            const likeDeletion = await InteractionsModel.destroy({
                where: {
                    id: likeId
                }
            })
            return likeDeletion ? true : false
        } catch (e) {
            console.error(e);
            return false
        }
    }
    static async FindByUserIdFrom(userIdFrom: number): Promise<InteractionsModel | null>{
        try{
            const interaction = await InteractionsModel.findOne({
                where: {userIdFrom}
            })  

            if(!interaction){
                return null;
            }

            return interaction
        } catch(e){
            console.error(e);
            return null;
        } 
    }
}

InteractionsModel.init({
    id: {
        type: DataTypes.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    interactionType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userIdFrom: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userIdTo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    interactionTime: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    matched: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    }
}, {
    sequelize, 
    tableName: 'interactions',
    timestamps: false
})


export default InteractionsModel