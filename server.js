const express = require('express')
const app = express()
const sql = require('mysql2');
const util = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const shell = require('shelljs');





app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('assets'))


const con = sql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'jwt'
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to database !");
});

const query = util.promisify(con.query).bind(con);

app.set('view engine', 'ejs');

async function checkISJwtTokentIsSet  (req){

    if(req.cookies.jwtToken)
    {
    let verified = jwt.verify(req.cookies.jwtToken,'shhhhh');
    
    return verified;
    }
    else{
        return false;
    }
}

app.get('/', async (req, res) =>{
    
   let verified = await checkISJwtTokentIsSet(req);
   if(!verified)
   {
    res.render('login')
   }
   else{
   let data = await query(`SELECT * FROM jwt.user where id = '${verified.id}' and isVerify=true`);
   (data.length)?(res.render('home',{name:data[0].name})):(res.redirect('/get/verify'));
   }


})

app.get('/get/Registration',async(req,res)=>{
    let verified = await checkISJwtTokentIsSet(req);
   (verified)?(res.redirect('/')):(res.render('registration'));

})
app.post('/post/Registration',async (req, res) =>{
    
    let salt = bcrypt.genSaltSync(10);
    let hashedPassword = bcrypt.hashSync(req.body.password, salt);
    

     let data = await query(`insert into user(name,email,password) values('${req.body.username}','${req.body.email}','${hashedPassword}')`);
     
     let token = jwt.sign({ id: data.insertId },'shhhhh');
     res.cookie('jwtToken', token)

     res.redirect(`/get/verify?jwtToken=${token}`)
    //res.render("login")
})

app.get('/get/login', async (req, res)=>{
    let verified = await checkISJwtTokentIsSet(req);
   (verified)?(res.redirect('/')):(res.render('login'));

})

app.post('/post/login',async (req,res) =>{

    let data = await query(`SELECT * FROM jwt.user where email = '${req.body.email}'`);
   
    if(data.length == 0)
    {
        res.send("user not found");
    }
    else{
        var isMatch =  bcrypt.compareSync(req.body.password, data[0].password);
        if(isMatch){
            let token = jwt.sign({ id: data[0].id },'shhhhh');
            res.cookie('jwtToken', token)
            res.redirect('http://localhost:8080/')
        }
        else{
            res.send("password is incorrect")
        }   
    }
})


app.get('/get/logout',(req,res) =>{
   
    res.clearCookie('jwtToken')
    res.render('login');
})

app.get("/get/user",async (req, res) =>{
    data = await query("select email from jwt.user")
    res.json(data.map(item=>item.email));
});

app.get("/get/verify", (req, res) =>{
   
    res.render("verify");

});
app.get("/get/checkVerification", async (req, res) =>{
   
    
    try{
        let verified = jwt.verify(req.cookies.jwtToken,'shhhhh');
        await query(`update jwt.user set isVerify = true where id=${verified.id}`)
        res.redirect('/');
    }
    
    catch(err){
        res.send("link is not valid");
    }

});



app.listen(8080,(err)=>{
    if (err) throw err; console.log("server start")
});
