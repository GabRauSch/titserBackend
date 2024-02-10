import { DataTypes, Model, Optional, QueryTypes, Sequelize, where } from "sequelize";
import sequelize from "../config/mysql";
import UsersModel from "./Users";
import { Op } from "sequelize";
import InteractionsModel from "./Interactions";

export interface MessagesAttributes {
    id: number,
    userIdFrom: number,
    userIdTo: number,
    messageContent: string,
    messageDate: number,
    seen: boolean
}
interface MessagesCreateAttributes extends Optional<MessagesAttributes, 'id'>{};

class MessagesModel extends Model<MessagesAttributes, MessagesCreateAttributes> implements MessagesAttributes{
    public id!: number;
    public userIdFrom!: number;
    public userIdTo!: number;
    public messageContent!: string;
    public messageDate!: number;
    public seen!: boolean

    static async ReadMessages(userIdFrom: number, userIdTo: number): Promise<boolean>{
        try {
            const messagesRead = await MessagesModel.update({
                seen: true
            },{
                where: {
                    [Op.or]: [
                        {userIdFrom, userIdTo}
                    ],
                    seen: false
                }
            })

            return messagesRead ? true : false

        } catch (e) {
            console.error(e);
            return false
        }
    }

    static async SendMessage(userIdFrom: number, userIdTo: number, content: string): Promise<boolean>{
        try{
            const matched = await InteractionsModel.LikeFromUsersId(userIdTo, userIdFrom)
            if(!matched?.matched){
                return false
            }

            const timestamp = Date.now();
            console.log('akdfsjasdklfjlasdkjdsfklskfjaskldjfklçs', timestamp)
            const createLikeMessage = await MessagesModel.create({
                messageContent: content, 
                userIdFrom,
                userIdTo,
                messageDate: timestamp,
                seen: false
            })

            return createLikeMessage ? true : false
        } catch(e){
            console.error(e);
            return false;
        }
    }

    static async ListMessagesFromUser(userIdFrom: number, userIdTo: number, alreadyRetrievedMessagesIds: number[]): Promise<MessagesModel[] | null>{
        try {
            alreadyRetrievedMessagesIds.length == 0 ? alreadyRetrievedMessagesIds = [0] : null  
            const rawQuery = `SELECT 
                id,
                seen, 
                messageDate,
                userIdFrom,
                userIdTo,
                messageContent,
                CASE 
                    WHEN userIdFrom = :userIdFrom THEN 'sent' 
                    ELSE 'received' 
                END AS direction
            FROM 
                messages
            WHERE 
                (
                    (userIdFrom = :userIdFrom AND userIdTo = :userIdTo)
                    OR (userIdFrom = :userIdTo AND userIdTo = :userIdFrom)
                )
                AND id not in (:alreadyRetrievedMessagesIds)
            ORDER BY 
                "messageDate" ASC
            LIMIT 1000    
            ;`

            const messages = await sequelize.query(rawQuery,{
                replacements: {userIdFrom, userIdTo, alreadyRetrievedMessagesIds},
                type: QueryTypes.SELECT
            })

            return messages as MessagesModel[]
              
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    static async ListChats(userId: number): Promise<MessagesModel[] | null>{
        try {
            const rawQuery = `
            SELECT
                m.id,
                u.customName,
                u.id as otherUserId,
                u.photo,
                m.seen,
                m.messageContent,
                m.userIdFrom,
                m.userIdTo,
                CASE 
                    WHEN m.userIdFrom = :userId THEN 'sent' 
                    ELSE 'received' 
                END AS direction,
                m.messageDate
            FROM messages m
            JOIN users u ON (CASE WHEN m.userIdFrom = :userId THEN m.userIdTo ELSE m.userIdFrom END = u.id)
            JOIN (
                SELECT
                    MAX(id) AS last_message_id
                FROM messages
                WHERE userIdFrom = :userId OR userIdTo = :userId
                GROUP BY 
                    CASE 
                        WHEN userIdFrom = :userId THEN userIdTo 
                        ELSE userIdFrom 
                    END
            ) lm ON m.id = lm.last_message_id
            ORDER BY m.messageDate DESC;`

            const chats = await sequelize.query(rawQuery, {
                replacements: {userId},
                type: QueryTypes.SELECT
            })
            return chats as MessagesModel[]
        } catch (e) {
            console.error(e);
            return null
        }
    }

}

MessagesModel.init({
    id: {
        type: DataTypes.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    userIdFrom: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userIdTo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    messageContent: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    messageDate: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    seen: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    sequelize, 
    tableName: 'messages',
    timestamps: false
})


export default MessagesModel