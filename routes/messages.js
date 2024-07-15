const express = require('express');
const Message = require('../models/message');
const {ensureCorrectUser,ensureLoggedIn} = require('../middleware/auth');
const router = new express.Router();
const ExpressError = require('../expressError');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function(req, res, next){
    try{
        const username = req.user.username;
        const message = Message.get(req.params.id);
        if(!message) throw new ExpressError(`There is no message of id ${req.params.id}!`, 404)
        if (message.from_user.username === username || message.to_user.username === username){ 
            return res.json({ message })           
        } else {
            throw new ExpressError('Unauthorized request', 401)
        }
    }catch(e){
        return next(e);
    }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/",ensureLoggedIn, async function(req, res, next){
    try{
        const from_username = req.user.username;
        
        const {to_username, body} = req.body;
        const message = Message.create({from_username, to_username, body});
        if(!message) throw new ExpressError(`Message was not created!`, 400)
        return res.json({message});
    }catch(e){
        return next(e);
    }
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureCorrectUser, async function(req, res, next){
    try{
        const recipient = await Message.get(req.params.id);
        if (recipient.to_user.username === req.user.username) {
            const message = await Message.markRead(req.params.id);
            return res.json({ message })
        } else {
            throw new ExpressError('Unauthorized request', 401)
        }
    }catch(e){
        return next(e);
    }
});

module.exports =router;
