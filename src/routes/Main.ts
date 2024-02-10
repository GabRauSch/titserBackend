import { Router } from "express";
import * as InteractionsController from '../controllers/InteractionsController'
import * as UserController from '../controllers/UserController'
import * as MessagesController from '../controllers/MessageController'
import * as AuthController from '../controllers/AuthController'
import multer from 'multer';
import { privateRoute } from "../config/passport";

const storage = multer.memoryStorage();
const upload = multer({
    dest: './tmp',
    fileFilter: (req, file, callBack)=>{
        console.log(file.mimetype)
        const allowed: string[] = ['image/jpg', 'image/jpeg', 'image/png']
        callBack(null, allowed.includes(file.mimetype))
    },
    limits: {fieldSize: 20000000}
})

const router = Router();

router.post('/like', privateRoute, InteractionsController.likeUser);
router.post('/dislike', privateRoute, InteractionsController.dislikeUser);

router.post('/auth/checkEmailAvailability', AuthController.checkEmailAvailability)
router.post('/auth/register', AuthController.register);
router.post('/auth/registerConfirmation', AuthController.registerConfirmation);
router.post('/auth/login', AuthController.login);

router.get('/users/matched/:userId', privateRoute,  UserController.findUsersThatMatched);
router.get('/user/:userId', privateRoute, UserController.retrieveUserInfo)
router.post('/users/liked', privateRoute,  UserController.getUsersThatLikedYou);
router.post('/users/dislikes', privateRoute,  UserController.getUsersThatYouDisliked);
router.post('/user/likes', privateRoute,  UserController.getUserLikes);
router.post('/userByLocation', privateRoute,  UserController.getUserByLocation);
router.post('/users/fullRetrieve',privateRoute,  UserController.getUserLIst);
router.post('/user/photo', privateRoute, upload.single('file'), UserController.setUserImage);
router.put('/user',  UserController.updateUserInfo);
router.put('/user/location', privateRoute,  UserController.setLocationByLatitudeAndLongitude);
router.put('/user/customName', privateRoute,  UserController.setUserName);

router.post('/messages/', privateRoute,  MessagesController.retrieveMessages);
router.post('/message/send', privateRoute,  MessagesController.sendMessage);
router.get('/messages/chats/:userId', privateRoute,  MessagesController.retrieveChats);
router.put('/messages/read', privateRoute,  MessagesController.readMessages);

export default router;
