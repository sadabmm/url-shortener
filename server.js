const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;

const validUrl = require('valid-url');

const bodyParser = require('body-parser');
const path = require("path");
const express = require("express");
const app = express();

//Save the link to your mongodb as an environment variable
var url = process.env.MONGOLAB_URI;
var appURL = 'https://smm-url.glitch.me/';

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));

app.post('/', (req,res)=>{
    var link = req.body.link;
    var randID = Math.floor(Math.random()*90000) + 10000;
    var linkData = {
        original: link,
        shortened: appURL+randID
    };
    if (validUrl.isUri(link)){
        MongoClient.connect(url, (err,db)=>{
            if (err) {
                console.log('Unable to connect to the mongoDB server. Error:', err);
            } else {
                console.log('Connection established to', url);
                const mydb = db.db('dwight').collection('urls');
                
                mydb.find({original:link}).toArray((err,result)=>{
                    if(err) {console.log('Error: '+err)}
                    if(result.length==0){
                        console.log('Link not found in database');
                        
                        mydb.insertOne(linkData, (err,res)=>{
                            if(err) throw err;
                            console.log(JSON.stringify(linkData));
                            //Close connection
                            db.close();
                        });
                        res.json({
                          original: link,
                          shortened: appURL+randID
                        });
                    } else {
                        console.log('Link already exists in database.');
                        var orig = result[0].original;
                        var short = result[0].shortened;
                        res.json({
                          original: orig,
                          shortened: short
                        });
                        db.close();
                    }
                });
            }
        });
    } else {
        res.json({error: 'INVALID LINK! Use proper link formatting. Example: https://www.google.com'});
    }
});

app.get('/:id', (req,res)=>{
    var urlId = req.params.id;
    MongoClient.connect(url, (err,db)=>{
        console.log('Connected to database.');
        if(err) throw err;
        var mydb = db.db('dwight').collection('urls');
        mydb.find({shortened: appURL+urlId}).toArray((err,result)=>{
            if(err) throw err;
            if(result.length==0){
                res.json({error: 'INVALID LINK!'});
                //Close database
                db.close();
            } else{
                console.log('Redirecting...');
                var redirectLink = result[0].original;
                res.redirect(redirectLink);
                db.close();
            }
        });
    });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, ()=>{
    console.log('Your app is listening on port: '+listener.address().port);
})
