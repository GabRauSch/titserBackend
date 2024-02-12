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

export interface UsersAttributes {
    id: number,
    email: string,
    confirmationCode: string,
    passwordHash: string,
    customName: string,
    description: string,
    currentLocation: Location;
    identityServiceId: number;
    birthday: Date;
    photo: string;
    gender: string;
}

interface UsersCreateAttributes extends Optional<UsersAttributes, 'id'>{};
interface UserCreationAttributes {email: string, passwordHash: string, confirmationCode: string}

class UsersModel extends Model<UsersAttributes, UserCreationAttributes> implements UsersAttributes{
    public id!: number;
    public email!: string;
    public confirmationCode!: string
    public passwordHash!: string
    public customName!: string;
    public description!: string;
    public currentLocation!: Location;
    public identityServiceId!: number;
    public birthday!: Date;
    public photo!: string;
    public gender!: string;

    static async UserByCustomName(customName: string): Promise<UsersModel | null>{
        try {
            const user = UsersModel.findOne({
                where: {
                    customName
                }
            })
            return user
        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async GetUserInfo(userId: number): Promise<any | null>{
        try {
            const rawQuery = `
                SELECT id, customName, TIMESTAMPDIFF(YEAR, birthday, CURDATE()) AS age,
                    description, gender, photo, targetAgeRange, targetGender, targetDistanceRange 
                FROM users
                WHERE id = :userId`;

            const user = await sequelize.query(rawQuery, {
                replacements: {userId},
                type: QueryTypes.SELECT
            })

            return user[0]

        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async UsersByConfirmationCode(userToken: string): Promise<UsersModel | null>{
        try {
            const user = await UsersModel.findOne({
                where: {
                    confirmationCode: userToken
                }
            });
            return user
        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async ConfirmCreation(userUpdate: UsersModel, customName: string): Promise<any | null>{
        try {
            
            const updatedUser = await userUpdate.update({
                confirmationCode: '',
                customName: customName
            });
            
            const data = {
                id: updatedUser.id,
                customName: updatedUser.customName,
                description: updatedUser.description,
                photo: updatedUser.photo,
                age: null,
                targetAgeRange: null,
                targetGender: null,
                targetDistanceRange: null,
                token: null
            }

            return data
        } catch (e) {
            console.error(e);
            return null
        }
    }

    static async UserByEmail(email: string): Promise<UsersModel | null>{
        try {
            const user = UsersModel.findOne({
                where: {
                    email
                }
            })
            return user
        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async CreateTemporaryUser(email: string, passwordHash: string, confirmationCode: string): Promise<number | null> {
        try {
            const creation = await UsersModel.create({
                email, 
                passwordHash,
                confirmationCode
            }, {
                returning: true
            })
            return creation.id || null
        } catch(e) {
            console.log(e)
            return null
        }
    }
    static async GetUserByEmailAndPasswordHash(email: string, passwordHash: string): Promise<UsersModel | null>{
        try {
            const user = UsersModel.findOne({
                where: {
                    email, passwordHash
                }
            })
            return user
        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async UpdateUserInfo(userId: number, data: UserUpdateData): Promise<boolean>{
        try {
            const columns = Object.keys(data);
            const values = Object.values(data);

            const setClause = columns.map((col, index) => `${col} = ?`).join(', ');
            console.log(setClause)
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
            return false
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
    static async GetUsersThatLiked(userIdTo: number, alreadyRetrievedIds: number[]): Promise<UsersModel[] | null>{
        try {
            alreadyRetrievedIds.length == 0 ? alreadyRetrievedIds = [0] : null;

            const rawQuery = `
            SELECT 
                u.customName,
                u.description,
                u.id, TIMESTAMPDIFF(YEAR, u.birthday, CURDATE()) AS age,
                u.photo 
            FROM users u 
                JOIN interactions i ON u.id = i.userIdFrom 
                    WHERE i.userIdTo = :userIdTo
                        AND i.matched = 0
                        AND i.interactionType = 'like'
                        AND i.userIdTo NOT IN (:alreadyRetrievedIds);           
            `
            const users: UsersModel[] = await sequelize.query(rawQuery, {
                replacements: {userIdTo, alreadyRetrievedIds},
                type: QueryTypes.SELECT
            })

            return users
            
        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async findMatches(userId: number): Promise<UsersModel[] | null>{
        try {
            const rawQuery = `
            SELECT
            u.id,
            i.userIdTo,
            u.customName,
            u.photo
        FROM interactions i 
            JOIN users u ON i.userIdTo = u.id
            LEFT JOIN messages m ON ((u.id = m.userIdFrom AND :userId = m.userIdTO) OR (u.id = m.userIdTo AND :userId = m.userIdFrom))
        WHERE i.matched = 1
            AND i.userIdFrom = :userId
            AND m.id IS NULL
        
        `;
            const matches: UsersModel[] = await sequelize.query(rawQuery, {
                type: QueryTypes.SELECT,
                replacements: {userId}
            })
            return matches

        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async GetUserLikes(userIdFrom: number, alreadyRetrievedIds: number[]): Promise<UsersModel[] | null>{
        try {
            alreadyRetrievedIds.length == 0 ? alreadyRetrievedIds = [0] : null
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
                    AND i.userIdTo NOT IN (:alreadyRetrievedIds)
                ORDER BY 
                    FIELD(interactionResponse, 'like', 'none', 'dislike');
            `;

            const users: UsersModel[] = await sequelize.query(rawQuery, {
                replacements: { userIdFrom, alreadyRetrievedIds },
                type: QueryTypes.SELECT
            });
            return users
        } catch (e) {
            console.error(e);
            return null
        }
    }
    static async GetUsersThatYouDisliked(userIdFrom: number, alreadyRetrievedIds: number[]): Promise<UsersModel[] | null>{
        try {
            alreadyRetrievedIds.length == 0 ? alreadyRetrievedIds = [0] : null
            const rawQuery = `
            SELECT 
                u.id, 
                u.customName, 
                TIMESTAMPDIFF(YEAR, u.birthday, CURDATE()) AS age, 
                u.photo,
                CASE 
                    WHEN i2.interactionType IS NOT NULL THEN i2.interactionType
                    ELSE 'none'
                END AS interactionResponse
            FROM 
                users u 
            LEFT JOIN 
                interactions i ON u.id = i.userIdTo
            LEFT JOIN 
                interactions i2 ON u.id = i2.userIdFrom AND i2.userIdTo = :userIdFrom
            WHERE 
                i.userIdFrom = :userIdFrom 
                AND i.interactionType = 'dislike'
                AND (i2.interactionType IN ('like', 'none') OR i2.interactionType IS NULL)
                AND i.userIdTo NOT IN (:alreadyRetrievedIds);`

            const users: UsersModel[] = await sequelize.query(rawQuery, {
                replacements: {userIdFrom, alreadyRetrievedIds},
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
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    confirmationCode: {
        type: DataTypes.STRING,
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customName: {
        type: DataTypes.STRING,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
    },
    currentLocation: {
        type: DataTypes.GEOMETRY('POINT'),
    },
    identityServiceId:{
        type: DataTypes.INTEGER,
    },
    birthday: {
        type: DataTypes.DATE,
    },
    photo: {
        type: DataTypes.STRING,
    },
    gender: {
        type: DataTypes.STRING,
    }
}, {
    sequelize, 
    tableName: 'users',
    timestamps: false
});


export default UsersModel;
