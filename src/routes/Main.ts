import { Router } from "express";
import * as InteractionsController from '../controllers/InteractionsController'
import * as UserController from '../controllers/UserController'
import * as MessagesController from '../controllers/MessageController'
import multer from 'multer'

const storage = multer.memoryStorage();
const upload = multer({
    dest: './tmp',
    fileFilter: (req, file, callBack)=>{
        const allowed: string[] = ['image/jpg', 'image/jpeg', 'image/png']
        callBack(null, allowed.includes(file.mimetype))
    },
    limits: {fieldSize: 2000000}
})

const router = Router();

router.post('/like', InteractionsController.likeUser);
router.post('/dislike', InteractionsController.dislikeUser);

router.get('/users/liked/:userId', UserController.getUsersThatLikedYou)
router.get('/users/dislikes/:userId', UserController.getUsersThatYouDisliked)
router.get('/user/likes/:userId', UserController.getUserLikes)
router.put('/user', UserController.updateUserInfo)
router.post('/user/photo', upload.single('photo'), UserController.setUserImage);
router.put('/user/location', UserController.setLocationByLatitudeAndLongitude);
router.post('/userByLocation', UserController.getUserByLocation)
router.post('/users/fullRetrieve', UserController.getUserLIst)
router.put('/user/customName', UserController.setUserName)

router.post('/message/send', MessagesController.sendMessage);
router.get('/messages/chats/:userId', MessagesController.retrieveChats)
router.put('/messages/read', MessagesController.readMessages)
router.get('/messages/:userIdFrom/:userIdTo', MessagesController.retrieveMessages)

export default router;
