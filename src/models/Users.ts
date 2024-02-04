import { DataTypes, Model, Optional, QueryTypes, col } from "sequelize";
import sequelize from "../config/mysql";
import InteractionsModel from "./Interactions";
import { Op } from "sequelize";
import { subYears } from 'date-fns';
import { UserUpdateData } from "../types/UserData";

type Location = {
    latitude: number,
    longitude: number
};

export type FullRetrieveData = {
    userId: number,
    ageRange: number[],
    location: Location,
    rangeInMeters: number,
    gender: string,
    idsRetrieved: number[]
};

interface UsersAttributes {
    id: number,
    customName: string,
    description: string,
    currentLocation: Location;
    identityServiceId: number;
    birthday: Date;
    photo: string;
    gender: string
}

interface UsersCreateAttributes extends Optional<UsersAttributes, 'id'>{};

class UsersModel extends Model<UsersAttributes, UsersCreateAttributes> implements UsersAttributes{
    public id!: number;
    public customName!: string;
    public description!: string;
    public currentLocation!: Location;
    public identityServiceId!: number;
    public birthday!: Date;
    public photo!: string;
    public gender!: string

    static async UpdateUserInfo(userId: number, data: UserUpdateData): Promise<boolean | null>{
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);

            const setClause = columns.map((col, index) => `${col} = ?`).join(', ');

            const rawQuery = `
            UPDATE users 
            SET ${setClause} 
            WHERE id = ?
            `;

            const userUpdate = await sequelize.query(rawQuery, {
            replacements: [...values, userId],
            type: QueryTypes.UPDATE
            });



            return userUpdate ? true : false
        } catch (e) {
            console.error(e);
            return null
        }
    }

    static async UsersExist(usersIds: number[]): Promise<Boolean>{
        try{
            const user = await UsersModel.findAll({
                where: {
                    id: {
                        [Op.in]: {
                            ...usersIds
                        }
                    }
                }
            })

            return user ? true : false
        } catch(e){
            console.error(e);
            return false;
        }
    }
    static async GetUsersThatLiked(userIdTo: number): Promise<UsersModel[] | null>{
        try {
            const rawQuery = `
            SELECT u.id, u.customName, TIMESTAMPDIFF(YEAR, u.birthday, CURDATE()) AS age, u.photo FROM users u 
                JOIN interactions i ON u.id = i.userIdFrom
            WHERE i.userIdTo = :userIdTo and i.interactionType = 'like'; `
            const users: UsersModel[] = await sequelize.query(rawQuery, {
                replacements: {userIdTo},
                type: QueryTypes.SELECT
            })

            return users
            
        } catch (e) {
            console.error(e);
            return null
        }
    }

    static async GetUserLikes(userIdFrom: number): Promise<UsersModel[] | null>{
        try {
            const rawQuery = `
            SELECT 
                u.id, 
                u.customName, 
                TIMESTAMPDIFF(YEAR, u.birthday, CURDATE()) AS age, 
                u.photo,
                i.interactionType AS interactionType,
                CASE 
                    WHEN i2.interactionType IS NOT NULL THEN i2.interactionType
                    ELSE 'none'
                END AS interactionResponse
            FROM 
                users u
                LEFT JOIN interactions i ON u.id = i.userIdTo AND i.userIdFrom = :userIdFrom
                LEFT JOIN interactions i2 ON u.id = i2.userIdFrom AND i2.userIdTo = :userIdFrom
            WHERE 
                i.interactionType IN ('like')
            ORDER BY 
                FIELD(interactionResponse, 'like', 'none', 'dislike');
 `
            const users: UsersModel[] = await sequelize.query(rawQuery, {
                replacements: {userIdFrom},
                type: QueryTypes.SELECT
            })
            return users
        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async GetUsersThatYouDisliked(userIdFrom: number): Promise<UsersModel[] | null>{
        try {
            const rawQuery = `
            SELECT u.id, u.customName, TIMESTAMPDIFF(YEAR, u.birthday, CURDATE()) AS age, u.photo FROM users u 
                JOIN interactions i ON u.id = i.userIdTo
            WHERE i.userIdFrom = :userIdFrom and i.interactionType = 'dislike'; `

            const users: UsersModel[] = await sequelize.query(rawQuery, {
                replacements: {userIdFrom},
                type: QueryTypes.SELECT
            })
            return users
        } catch (e) {
            console.log(e);
            return null;
        }
    }
    static async RetrieveUsersList(data: FullRetrieveData): Promise<UsersModel[] | null>{
        try{
            const {ageRange: [minAge, maxAge], location: {latitude, longitude}, rangeInMeters, userId, gender, idsRetrieved} = data;
            
            const rawQuery = `
                SELECT 
                    u.id,
                    u.customName,
                    u.description,
                    u.photo,
                    TIMESTAMPDIFF(YEAR, u.birthday, CURDATE()) AS age
                FROM users u
                LEFT JOIN Interactions i ON u.id = i.userIdTo AND i.userIdFrom = :userId
                WHERE 
                    DATEDIFF(CURDATE(), u.birthday) / 365.25 BETWEEN :minAge AND :maxAge
                    AND u.gender = :gender
                    AND u.id NOT IN (:userId, ${idsRetrieved.length == 0 ? 0 : idsRetrieved.join(',')})
                    AND i.userIdTo IS NULL
                    AND ST_Distance_Sphere(
                        POINT(:longitude, :latitude),
                        u.currentLocation
                    ) <= :rangeInMeters
                LIMIT 10;
            `;
            
            const users: UsersModel[] = await sequelize.query(rawQuery, {
                replacements: {userId, minAge, maxAge, gender, longitude, latitude, rangeInMeters},
                type: QueryTypes.SELECT
            });
            
            if (!users) {
                return null;
            }
            
            return users;
        } catch(e){
            console.error(e);
            return null;
        }
    }

    static async SetUserCurrentLocation(userId: number, {latitude, longitude}: Location): Promise<Boolean> {
        try {
            const encodedLongitude = longitude;
            const encodedLatitude = latitude;
            
            const userCurrentLocation = await UsersModel.update({
                currentLocation: sequelize.literal(`POINT(${encodedLongitude}, ${encodedLatitude})`),
            }, {
                where: { id: userId }
            });

            return userCurrentLocation ? true : false;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async GetUserByLocationRange({latitude, longitude}: Location, rangeInMeters: number): Promise<UsersModel[] | null>{
        try {
            const encodedLongitude = longitude;
            const encodedLatitude = latitude;
            
            const userCurrentLocation = await UsersModel.findAll({
                where: sequelize.where(
                    sequelize.fn(
                        'ST_Distance_Sphere',
                        sequelize.literal(`POINT(${encodedLongitude}, ${encodedLatitude})`),
                        sequelize.col('currentLocation')
                    ),
                    {
                        [Op.lte]: rangeInMeters
                    }
                )
            });

            return userCurrentLocation;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    static async GetUserByAgeRange(minAge: number, maxAge: number): Promise<UsersModel[] | null> {
        try {
            const maxBirthdate = subYears(new Date(), minAge);
            const minBirthdate = subYears(new Date(), maxAge);
    
            console.log(maxBirthdate, minBirthdate);
            const user = await UsersModel.findAll({
                where: {
                    birthday: {
                        [Op.between]: [minBirthdate, maxBirthdate],
                    },
                },
            });
    
            return user || null;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    static async setUserImage(userId: number, photo: string): Promise<Boolean>{
        try {
            const update = await UsersModel.update({
                photo
            }, {
                where: {
                    id: userId
                }
            })

            return update ? true : false

        } catch (e) {
            console.error(e);
            return false
        }
    }

    static async setUserName(userId: number, customName: string): Promise<Boolean>{
        try {
            const update = await UsersModel.update({
                customName
            }, {
                where: {
                    id: userId
                }
            })

            return update ? true : false

        } catch (e) {
            console.error(e);
            return false
        }
    }
}

UsersModel.init({
    id: {
        type: DataTypes.INTEGER,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    customName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    currentLocation: {
        type: DataTypes.GEOMETRY('POINT'),
    },
    identityServiceId:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    birthday: {
        type: DataTypes.DATE,
        allowNull: false
    },
    photo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize, 
    tableName: 'users',
    timestamps: false
});


export default UsersModel;
