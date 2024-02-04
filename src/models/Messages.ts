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
    messageDate: Date,
    seen: boolean
}
interface MessagesCreateAttributes extends Optional<MessagesAttributes, 'id'>{};

class MessagesModel extends Model<MessagesAttributes, MessagesCreateAttributes> implements MessagesAttributes{
    public id!: number;
    public userIdFrom!: number;
    public userIdTo!: number;
    public messageContent!: string;
    public messageDate!: Date;
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

            const timestamp = new Date();
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

    static async ListMessagesFromUser(userIdFrom: number, userIdTo: number): Promise<MessagesModel[] | null>{
        try {
            const rawQuery = `SELECT 
                messageContent,
                CASE 
                    WHEN userIdFrom = :userIdFrom THEN 'sent' 
                    ELSE 'received' 
                END AS direction
            FROM 
                messages
            WHERE 
                (userIdFrom = :userIdFrom AND userIdTo = :userIdTo)
                OR
                (userIdFrom = :userIdTo AND userIdTo = :userIdFrom)
            ORDER BY 
                "messageDate" ASC
            LIMIT 1000    
            ;`

            const messages = await sequelize.query(rawQuery,{
                replacements: {userIdFrom, userIdTo},
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
                messageContent,
                userIdFrom,
                userIdTo,
                messageDate
            FROM (
                SELECT
                    messageContent,
                    userIdFrom,
                    userIdTo,
                    messageDate,
                    ROW_NUMBER() OVER (PARTITION BY LEAST(userIdFrom, userIdTo), GREATEST(userIdFrom, userIdTo) ORDER BY messageDate DESC) AS row_num
                FROM Messages
                WHERE userIdFrom = :userId OR userIdTo = :userId
            ) AS ranked_messages
            WHERE row_num = 1;`

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
        type: DataTypes.DATE,
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