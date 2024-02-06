process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { error } = require("console")
const express = require("express")
const mysql = require("mysql")

const app = express()
app.set("view engine", "ejs")
app.use(express.static("design"))
app.use(express.json())
app.use(express.urlencoded({extended:false}))

//свързване към базата данни
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: "",
    database: "nodejs-login"
})

db.connect((error)=>{
    if(error)
    {
        console.log(error)
    }
    else{
        console.log("Mysql is connected")
    }
})

//различните рутърс
app.get("/",(req,res)=>{
    res.render(__dirname + "/front/login.ejs",{message:"no"})
})

app.get("/signup",(req,res)=>{
    res.render(__dirname + "/front/signup.ejs",{message:"no"})
})
app.get("/home",(req,res)=>{
    res.render(__dirname + "/font/home.ejs",{name:"no", email:"no", password:"no"})
})

//приемане на данните от форм за лог ин
app.locals.email_save = ""
app.post("/logindata",(req,res)=>{
    const name = req.body.person_name
    const email = req.body.email
    const password = req.body.password
    
    
   if(name === ""){
        res.render(__dirname + "/front/login.ejs",{message:"Please enter your name!"})
    }
    else{
        //проверка дали има съществуващ акаунт с този имейл
        db.query('SELECT email FROM users WHERE email = ?',[email],async (error, results)=>{
            if(error){
                console.log(error)
            }
            else{
                if(results.length > 0)
                {
                    //проверка дали има съществуващ аканут с конкретния имейл и тази парола
                    db.query('SELECT password FROM users WHERE password = ?',[password], async (error,results)=>{
                        if(error)
                        {
                            console.log(error)
                        }
                        else{
                            if(results.length > 0)
                            {
                                app.locals.email_save = email
                                // зареждане на хоум пейджа с данните на потребителя
                                return res.render(__dirname + "/front/home.ejs",{name:name,email:email,password:password})
                            }
                            else{
                                //резултат при грешна парола
                                return res.render(__dirname + "/front/login.ejs",{message:"Wrong password!"})
                            }
                        }
                        
                    })
                    
                }
                else{
                    // резултат при грешен имейл
                    return res.render(__dirname + "/front/login.ejs",{message:"Wrong email!"})
                }
            }
        })
    }

})


// създаване на нов потребител
app.post("/signupdata",async (req,res)=>{
    const name = req.body.person_name
    const email = req.body.email
    const password = req.body.password
    
    

    if(name === ""){
        res.render(__dirname + "/front/sign.ejs",{message:"Please enter your name!"})
    }
    else{
        // проверка дали съществува потребител с този имейл
        db.query('SELECT email FROM users WHERE email = ?',[email],async (error, results)=>{
            if(error){
                console.log(error)
            }
            else{
                if(results.length > 0)
                {
                    return res.render(__dirname + "/front/signup.ejs",{message:"This email is already taken!"})
                }
                else{
                    // проверка дали съществува потребител с тази парола
                    db.query('SELECT password FROM users WHERE password = ?',[password],async (error,results)=>{
                        if(error)
                        {
                            console.log(error)
                        }else{
                            if(results.length > 0)
                            {
                                
                                return  res.render(__dirname + "/front/signup.ejs",{message:"This password is already taken!"})
                            }
                            else{
                                // създаване на потребител в базата данни ако всички проверки минат успешно
                                db.query('INSERT INTO users SET ?',{name:name, email:email, password:password},async (error, results)=>{
                                    if(error)
                                    {
                                        console.log(error)
                                    }else{
                                        
                                        app.locals.email_save = email
                                        SendEmail(email)
                                        return res.render(__dirname + "/front/home.ejs",{name:name,email:email,password:password})

                                    }
                                })
                            }
                        }
                    })
                }
            }
        })
    }

    
})


const nodemailer = require("nodemailer");
// с тази функция се изпълнява верифицирането на акаунта 
async function SendEmail(export_email){
    const transporter = nodemailer.createTransport({
        service:"gmail",
        host: "smtp.gmail.com",
        port: 535,
        secure: false,
        auth: {
            //моят акаунт
            user: "stoyandyuzov@gmail.com",
            pass: "mwgg nczc etjd csvg",
        }
    });

    const html_data = `
    <h1>Verified!</h1>
    <h1>Thank you!</h1>
    `
    
    async function main() {

        const info = await transporter.sendMail({
            from: '"Login" <stoyandyuzov@gmail.com>', 
            // имейлът до който трябва да бъде изпратено съощението
            to: export_email, 
            subject: "Verification", 
            html: html_data,
        });
    }
    main().catch(console.error);

}

// тази функция позволява на потребителя да смени имейлът си в базата данни
app.post("/changename",async (req,res)=>{
    db.query("UPDATE users SET email = ? WHERE email = ?",[req.body.newemail, app.locals.email_save],(error,results)=>{
        if(error)
        {
            console.log(error)
        }
        else{
           return res.render(__dirname + "/front/login.ejs",{message:"no"})
        }
    })
})

// стартиране на сървър
app.listen(5000,()=>{
    console.log("Server is running")
})