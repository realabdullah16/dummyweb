const express = require('express');
const bodypar = require('body-parser');
const path = require('path');
const mysql = require('mysql');
const hbx = require('hbs');
// const exfile = require('express-fileupload');
const fs = require('fs');
const session = require('express-session');
const cookie  = require('cookie-parser');
const multer = require('multer');
const dest7 = path.join(__dirname,'../uploads');

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
      cb(null, dest7)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  
})
const upload = multer({storage:storage});


const dest1 = path.join(__dirname, '../templates/views');
const dest2 = path.join(__dirname, '../templates/partials');
const dest3 = path.join(__dirname, '../public');
const dest4 = path.join(__dirname, '../images');
const dest6 = path.join(__dirname, '../users');
const app = express();


app.use(cookie());
app.use(session({
    secret: 'myfirstsession',
    resave: false,
    cookie: { secure: false, maxAge: 600000},
    saveUninitialized: true
}));

// app.use(exfile());
app.use(bodypar.json());
app.use(bodypar.urlencoded({ extended: true }));
app.set('views', dest1);
hbx.registerPartials(dest2);
app.use(express.static(dest3));
app.set('view engine', 'hbs');
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'signlog',
    password: 'password'
});
conn.connect((err) => {
    if (err) console.log('connection to database failed');
    console.log('successful connection to  database.');
});

app.get('/home', (req, res) => {
const mail = req.cookies.mail;
if(mail){
res.redirect('/login');
}
else{
    const query = `select * from signup`;
    conn.query(query, (err, data) => {
        if (data == null) console.log('record not found');
        res.render('home', {
            data: data,
        });
        if (err) console.log('failed to fatch data');    
});
}
});
app.get('/signup', (req, res) => {
    res.render('signup');
});
app.get('/login', (req, res) => {
    res.render('login', {

        status: true,
    });
});


app.post('/signup', (req, res) => {

    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth();
    var year = today.getFullYear();
    var date = day + "-" + month + "-" + year;
    var data = [req.body.name, req.body.mail, req.body.age, req.body.city, req.body.password, date];
    var mail = req.body.mail;
    var folder = mail;
    const query1 = `select mail from signup where mail = '${mail}'`;
    const query2 = `insert into signup(s_no,name,mail,age,city,password,DOJ,folder) values( ${null},'${data[0]}','${data[1]}',${data[2]},'${data[3]}','${data[4]}','${data[5]}','${folder}')`;


    conn.query(query1, (err, result) => {
        if (err) console.log('error(4)', err);
        if (result != '') {
            res.send('account already exist!<br><a href="/home">back</back><br><a href="/login">login</back>');
        }
        else {
            conn.query(query2, (err) => {
                if (err) console.log('failed query.', err);
                console.log('successful query execution.');
                fs.mkdir(dest6 + "/" + folder, (err) => {
                    if (err) console.log('folder not developed',err);
                    console.log('folder developed.');
                });
                res.send('successful!<br><a href="/home">back</back><br><a href="/login">login</back>');
            });
        }
    });
});



app.post('/login', (req, res) => {
    var mail = req.body.mail;
    var password = req.body.password;
    const query1 = `select * from signup where mail = '${mail}'`;
    const query2 = `select password from signup where mail = '${mail}'`;

    conn.query(query1, (err, data) => {
        var username = data[0].Name;
        var usermail = data[0].mail;
        if (data != '') {
            console.log("account exist");
            conn.query(query2, (err, data) => {
                if (data[0].password == password) {
                    console.log('password matched');
                    res.cookie('name',username)
                    res.cookie('mail',usermail)
                    res.cookie('cookie1','i am khan',{maxAge: 6000});
                    res.redirect('/dashboard');
                    }

                else {
                    console.log('wrong password');
                    res.render('login', {
                        status: false,
                        mail: mail,
                        password: password,
                        message: 'Wrong password',
                    });
                }

            });
        }

        else {
            console.log('account NOT exist');
            res.render('login', {
                status: false,

                reg: true,
                mail: mail,
                password: password,
                message: "account do not exist ",
            });
        }
    });
});

app.get('/dashboard', (req, res) => {
    console.log('name: '+req.cookies.name);
    console.log('mail: '+req.cookies.mail);
    res.render('dashboard', {
        showmessage: false,
        message: 1
    });
});


app.post('/dashboard', (req, res) => {
    var mail = req.session.mail;
    var file = req.files.img;
    var name = file.name;
    var size = file.size;
    var extn = path.extname(name);
    console.log("name: " + name);
    console.log("size: " + size);
    console.log("extension" + extn);
    if (extn == '.png' && '.jpg' && '.jpeg' && '.gif') {
        if (size <= 500000) {
            const dest = path.join(__dirname, `../users/${mail}`);
            file.mv(dest + "/" + name, (err) => {
                if (err) console.log('file not saved');
                console.log('file saved successfully');
                res.send('<h1>success</h1><br><a href="/dashboard">back</a>');
            });
        }
        else {
            console.log('file too large');
            res.send('<h1>file too large</h1><br><a href="/dashboard">back</a>');
        }
    }
    else {
        console.log('file type not allowed');
        res.send('<h1>file type not allowed</h1><br><a href="/dashboard">back</a>');
    }

});

app.get('/redirecting',(req,res)=>{
res.clearCookie('mail');
res.redirect('/home');
});

app.get('/multer',(req,res)=>{
res.render('multer');
});
const cpUpload = upload.single('img1');
app.post('/multer',cpUpload,(req,res)=>{
res.send('success');
console.log(req.file.originalname);
});

app.listen(8080, () => {
    console.log('successful connection 1', 8080);
});
