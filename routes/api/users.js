const express = require('express'); 
const router = express.Router(); 
const User = require('../../models/User'); 
const bcrypt = require('bcryptjs');
const keys = require('../../config/keys_dev');  
const jwt = require('jsonwebtoken'); 
const passport = require('passport'); 
const validateRegisterInput = require('../../validation/register'); 
const validateLoginInput = require('../../validation/login'); 


router.get('/test', (req, res) => {
    res.json({ msg: "This is the user route" }); 
});

router.get('/', (req, res) => {
    User.find()
        // .sort({ date: -1 })
        .then(tweets => res.json(tweets))
        .catch(err => res.status(400).json(err)); 
});

router.get('/current', passport.authenticate('jwt', {session: false}), (req, res) => {
    res.json({
        id: req.user.id, 
        handle: req.user.handle, 
        email: req.user.email,
        to_learn: req.user.to_learn,
        to_share: req.user.to_share,
        date: req.user.date, 
        pic: req.user.pic
    })
})

router.post('/register', (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body); 
    
    if (!isValid) {
        return res.status(400).json(errors); 
    }

    User.findOne({ email: req.body.email })
        .then(user => {
            if (user) {
                return res.status(400).json({email: "A user is already registered with that email"})
            } else {
                const newUser = new User({
                    handle: req.body.handle, 
                    email: req.body.email, 
                    password: req.body.password,
                    to_learn: req.body.to_learn,
                    to_share: req.body.to_share,
                    pic: req.body.pic
                }); 

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if(err) throw err; 
                        newUser.password = hash; 
                        newUser.save()
                            .then((user) => res.json(user))
                            .catch(err => console.log(err)); 
                    })
                })
            }
        })
})



router.post('/login', (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body); 

    if (!isValid) {
        return res.status(400).json(errors); 
    }

    const email = req.body.email; 
    const password = req.body.password; 

    User.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(404).json({email: 'This user does not exist.'});
            }

            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        const payload = {
                            id: user.id, 
                            handle: user.handle, 
                            email: user.email,
                            to_learn: user.to_learn,
                            to_share: user.to_share,
                            date: user.date,
                            pic: user.pic,
                        }
                        jwt.sign(
                            payload, 
                            keys.secretOrKey, 
                            { expiresIn: 3600 }, 
                            (err, token) => {
                                res.json({
                                    success: true, 
                                    token: "Bearer " + token 
                                }); 
                            }
                        )
                    } else {
                        return res.status(400).json({password: 'Incorrect password.'});
                    }
                })
        })
})

router.patch("/current", 
    passport.authenticate("jwt", { session: false }),
    (req, res)=>{
        // console.log(req.user) 
        // console.log(req.body.to_learn)
        // console.log(req.body.to_share)
        req.user.to_learn = req.body.to_learn
        req.user.to_share = req.body.to_share
        req.user.save()
            .then((user) => res.json(user))
            .catch(err => console.log(err)); 
        // console.log(req.user) 
    }
    

)

module.exports = router; 