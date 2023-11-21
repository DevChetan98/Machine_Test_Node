const express =require("express");
const app =express();
const bodyParser=require("body-parser");
const cookieSession=require('cookie-session');
const cookieParser=require('cookie-parser');
// const db =require("./model");


app.use(cookieSession({name:"session",keys:["test"],maxAge:24*60*60*100}))
app.use(cookieParser());
app.use(bodyParser.json());

app.use(express.json());

require("./route/user.routes")(app)

const PORT=process.env.PORT||8080;

app.get('/',function(req,res){
    res.send({message:`Server is running on port ${PORT}`})
});

// db.sequelize.sync();
app.listen(PORT, ()=>{
    console.log(`Server is runnig on port ${PORT}`)
})


