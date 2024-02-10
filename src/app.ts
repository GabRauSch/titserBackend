import express, {ErrorRequestHandler, Request, Response} from 'express';
import dotenv from 'dotenv';
import path from 'path'
import sequelize from './config/mysql';
import InteractionsModel from './models/Interactions';
import Main from './routes/Main';
import { MulterError } from 'multer';

dotenv.config()

const app = express();

sequelize.authenticate();

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.use(Main);

app.use((req: Request, res: Response)=>{
    res.status(404)
    res.json({err: "404 route doesn't exist"})
})

const errorHandler: ErrorRequestHandler = (err, req, res, next)=>{
    res.status(400);

    if(err instanceof MulterError){
        return res.json({error: err.code})
    }
    return res.json({err})
}
app.use(errorHandler)


export default app