const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
const db = require('../model');
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config/auth.config"); 


//*IsEmpty Check function
function isEmpty(obj) {
    return !obj || Object.keys(obj).length === 0;
}

//*Remove Password in Responce
function removePasswordFromRows(rows) {
    const rowWithoutPassword = rows[0];
    delete rowWithoutPassword.password
    return [rowWithoutPassword]
}


//*Registration API
exports.registration = (req, res) => {
    console.log("APi CAlling");
    const email = req.body.email
    const password = req.body.password
    const username = req.body.username
    if (!email) {
        return res.send({ status: false, message: "email can not be empty" })
    }

    let final_password = bcrypt.hashSync(password, 8);
    const findUSer = "SELECT * FROM user WHERE email='" + email + "'";
    db.sequelize.query(findUSer, null, { raw: true, }).then(function (myTableRows) {
        if (isEmpty(myTableRows[0])) {
            InserQuery = "INSERT INTO user(username,email,password)VALUES('" + username + "','" + email + "','" + final_password + "')";
            db.sequelize.query(InserQuery, null, { raw: true, }).then(async function (myTableRows) {
                return res.send({
                    status: true,
                    message: "User successfully registered",
                    id: myTableRows[0],
                })
            })
        } else {
            if (myTableRows[0][0].email == email) {
                return res.send({ status: false, message: "email already exists!" })
            }
        }
    })
}

//*Login API

exports.login = (req, res) => {
    const cookies = req.cookies;
    console.log(`cookie available at login : ${JSON.stringify(cookies)}`);
    const email = req.body.email;
    const password = req.body.password;

    if (!email) {
        return res.send({
            status: false,
            message: "Email cannot be empty!",
            data: [],
        });
    }

    if (!password) {
        return res.send({
            status: false,
            message: "Password cannot be empty!",
            data: [],
        });
    }

    let emailExists = "SELECT * FROM user WHERE email='" + email + "'";

    db.sequelize.query(emailExists, null, { raw: true }).then(function (myTableRows) {
        if (isEmpty(myTableRows[0])) {
            return res.send({ status: false, message: "These credentials do not match our records!" });
        } else {
            bcrypt.compare(password, myTableRows[0][0].password, async function (err, isPasswordValid) {
                if (err) {
                    return res.send({
                        status: false,
                        message: "Email and password do not match",
                        data: [],
                    });
                }
                if (isPasswordValid) {
                    // Send JWT Token
                    const foundUser = myTableRows[0][0];
                    const secretKey = config.secret;
                    console.log(secretKey);
                    const payload = {
                        email: myTableRows[0][0].email,
                        username: myTableRows[0][0].username,
                    };
                    const options = {
                        expiresIn: "1m", // 1 minute
                    };
                    const token = jwt.sign(payload, secretKey, options);
                    const username = myTableRows[0][0].username;

                    // Assign the refresh token to an HTTP-Only cookie
                    const refreshToken = jwt.sign({ email, password }, secretKey, { expiresIn: "1d" });
                    res.cookie("jwt", refreshToken, {
                        httpOnly: true,
                        sameSite: "None",
                        secure: true,
                        maxAge: 24 * 60 * 60 * 1000, // 1 day
                    });

                    myTableRows[0][0]["accessToken"] = token;
                    myTableRows[0][0]["refreshToken"] = refreshToken;

                    let result = removePasswordFromRows(myTableRows[0]);
                    return res.send({
                        status: true,
                        message: "You are successfully logged in as: " + username,
                        data: result,
                    });
                } else {
                    return res.send({ status: false, message: "Password does not match" });
                }
            });
        }
    });
};


//Genrate New Access Token using Refresh Token 
exports.refreshToken=(req,res)=>{
 console.log("req.cookies?.jwt : ",req.cookies?.jwt);
 console.log("Request Headers : ",req.headers);
 console.log("request cookies:",req.cookies);

 if(req.cookies?.jwt){
    res.clearCookie('jwt',{httpOnly:true,sameSite:"None",secure:true});
    //Destructuring refreshToken from cookie
    const refreshToken=req.cookies.jwt;

    //Verfying refresh token 
    jwt.verify(refreshToken,config.secret,(err,decoded)=>{
        if(err){
            //Wrong Refres Token 
            return res.status(406).json({status:false,message:"Unauthorized"})
        }
        else{
            //Correct token we can extract user information from the decoded payload
            const {email,username}=decoded
            const accessToken=jwt.sign({
                username:username,
                email:email
            },config.secret,{
                expiresIn:'1m'
            }
            );
            console.log("decoded==",decoded)

            return res.status(200).json({status:true,message:"Get New Access Token",accessToken:accessToken})
            //*return With decoded user data
            // return res.status(200).json({status:true,message:"Get New Access Token",accessToken:accessToken,result:decoded})

        }
    })
 }else{
    return res.status(406).json({
        status:false,
        message:"Unauthorized"
    });
 }
};

//Get User Profile (Is Logged)
exports.getUserPofile=(req,res)=>{
    const userId=req.query.userId;
    if(!userId){
        return res.send({status:false,message:"User Id can not be empty!",data:[]})
    }
    let sql="SELECT * FROM user WHERE id='"+userId+"'"
    db.sequelize.query(sql,null,{raw:true,}).then(function (myTableRows){
        if(myTableRows[0].length>0){
            return res.send({status:true,message:"Get user profile details",data:myTableRows[0]})
        }else{
            return res.send({status:false,message:"User not found"})
        }
    })
}


