const jwt=require('jsonwebtoken');
const config=require('../config/auth.config.js');

verifyToken=(req,res,next)=>{
    let token=req.headers['x-access-token'];
    if(!token){
        return res.send({status:404,data:[],token:null,message:"No token provided!"})
    }
    jwt.verify(token,config.secret,(err,decoded)=>{
        if(err){
            return res.send({status:404,data:[],message:"Unauthorized!"});
        }
        req.userId=decoded.id;
        req.email=decoded.email;
        req.username=decoded.username;
        next();
    });
};

const authJwt={
    verifyToken:verifyToken
}
module.exports=authJwt;
