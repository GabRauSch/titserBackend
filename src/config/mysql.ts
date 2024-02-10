import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let databaseConfig = {
    database: process.env.MYDB as string,
    databaseName: process.env.MYDBNAME as string,
    databasePass: process.env.MYDBPASS as string,
    databasePort: parseInt(process.env.MYDBPORT as string) 
}

if(process.env.NODE_ENV == 'test'){
    databaseConfig.database = process.env.MYDB_TEST as string
}

const sequelize = new Sequelize(
    databaseConfig.database,
    databaseConfig.databaseName,
    databaseConfig.databasePass,
    {
        dialect: 'mysql',
        port: databaseConfig.databasePort,
        logging: true,
        logQueryParameters: true
    }
);

export default sequelize;