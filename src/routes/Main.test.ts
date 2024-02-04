import request from "supertest";
import app from '../app';
import Main from './Main';
import InteractionsModel from "../models/Interactions";
import UsersModel from "../models/Users";

describe('testing api routes', ()=>{
    beforeAll(async ()=>{
        await InteractionsModel.sync();
        InteractionsModel.destroy({where:{}, truncate: true})
        await UsersModel.sync();
    })
    it('Should return Created register LIKE', (done)=>{
        request(app)
            .post('/like')
            .send({ userIdFrom: 1, userIdTo: 2 })
            .then(response =>{
                expect(response.body.Success).toBe('Created register')
                return done()
            })
    })
    it("Should return Error missing attributes LIKE", (done)=>{
        request(app)
            .post('/like')
            .send({ userIdFrom: 1})
            .then(response =>{
                expect(response.status).toBe(400);
                return done()
            })
    })
    it('Should return Created register DISLIKE', (done)=>{
        request(app)
            .post('/dislike')
            .send({ userIdFrom: 1, userIdTo: 2 })
            .then(response =>{
                expect(response.body.Success).toBe('Created register')
                return done()
            })
    })
    it("Should return Error missing attributes DISLIKE", (done)=>{
        request(app)
            .post('/dislike')
            .send({ userIdFrom: 1})
            .then(response =>{
                expect(response.status).toBe(400);
                return done()
            })
    })
})

