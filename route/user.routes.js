module.exports=app=>{
    const user=require("../controller/user.controller.js");
    var router= require('express').Router();
    const {authJwt}=require("../Middleware/index.js");

    router.post("/registration",user.registration);
    router.post("/login",user.login);
    router.get("/refresh_token",user.refreshToken)
    router.get("/get_user_profile",[authJwt.verifyToken],user.getUserPofile)

    
    app.use('/api/user/',router);
};

