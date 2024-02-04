import { Op, Sequelize } from "sequelize";
import Interactions from "./Interactions";
import sequelize from "sequelize";


describe("Testing Interactions Model", ()=>{

    let userIdFrom = 1;
    let userIdTo = 2;

    beforeAll(async ()=>{
        await Interactions.sync()
    })

    it("Should create a like Interaction", async ()=>{
        const newInteraction = await Interactions.CreateLikeInteraction(userIdFrom, userIdTo) as Interactions

        expect(newInteraction).not.toBeInstanceOf(Error);
        expect(newInteraction).toHaveProperty('id');
        expect(newInteraction.userIdFrom).toBe(userIdFrom)
        expect(newInteraction.userIdTo).toBe(userIdTo);
        expect(newInteraction.interactionType).toBe('like')
    });
    it("Shoud create a dislike Interaction", async ()=>{
        const newInteraction = await Interactions.CreateDislikeInteraction(userIdFrom, userIdTo) as Interactions

        expect(newInteraction).not.toBeInstanceOf(Error);
        expect(newInteraction).toHaveProperty('id');
        expect(newInteraction.userIdFrom).toBe(userIdFrom)
        expect(newInteraction.userIdTo).toBe(userIdTo);
        expect(newInteraction.interactionType).toBe('dislike')
    })

    it("Should return a dislike from both userIdFrom and userIdTo", async ()=>{
        const dislike = await Interactions.DislikeFromUsersId(userIdFrom, userIdTo) as Interactions;

        expect(dislike).not.toBeInstanceOf(Error);
        expect(dislike.userIdFrom).toBe(userIdFrom);
        expect(dislike.userIdTo).toBe(userIdTo);
    })
    it("Should return an empty array value", async ()=>{
        const dislike = await Interactions.sequelize?.query(
            "SELECT * FROM interactions WHERE userIdFrom = userIdTo",
            { type: sequelize.QueryTypes.SELECT }
        )

        expect(dislike).toHaveLength(0);
    })
})