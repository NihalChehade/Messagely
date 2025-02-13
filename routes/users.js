const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async function(req, res, next){
    try{
        const users = await User.all();
        
        return res.json({users});
    
    }catch(e){
        return next(e);
    }
    
})

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get("/:username", ensureCorrectUser, async function(req, res, next){
    try{
        const user = User.get(req.params.username);
        
        return res.json({user});
    }catch(e){
        return next(e);
    }
});


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to", ensureCorrectUser, async function(req, res, next){
    try{
        const messages = User.messagesTo(req.params.username);
        if(!messages) throw new ExpressError(`No messages to user ${username}!`, 404)
        return res.json({messages});
    }catch(e){
        return next(e);
    }
});


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/from", ensureCorrectUser, async function(req, res, next){
    try{
        const messages = User.messagesFrom(req.params.username);
        if(!messages) throw new ExpressError(`No messages from user ${username}!`, 404)
        return res.json({messages});
    }catch(e){
        return next(e);
    }
});
module.exports =router;