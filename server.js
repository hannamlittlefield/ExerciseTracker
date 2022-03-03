const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')
//require mongoose
const mongoose = require('mongoose')
//require bodyparser
const bodyParser = require('body-parser')
require('dotenv').config()
  
//use bodyparser - deprecated. change all to express
app.use(express.json());
app.use(express.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/exercise/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

//connect to mongoose w url
mongoose.connect('mongodb+srv://hlittlefield:Tonkatruck4!@cluster0.tlijw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {useNewUrlParser: true}, {useUnifiedTopology: true});

//connect Schema var to mongoose
const Schema = mongoose.Schema

var exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});

const Exercises = mongoose.model("Exercises", exerciseSchema);

var usernameSchema = new mongoose.Schema({
  username: String,
  workouts: [
    {description: String,
    duration: Number,
    date: Date}
  ]
});

var Users = mongoose.model("Users", usernameSchema);

app.post("/api/users", (req, res) => {
  let username = req.body.username;
  Users.findOne({username: username}, (err, data) => {
    if (err) {return console.error(err);}
    else {
      if (data !== null) {
        res.json("Username already taken");
      } else {
        let newUser = new Users({username: username, exercise: []});
        newUser.save((err, updatedUser) => {
          if (err) {return console.error(err);}
          else {
            res.json({"username": username, "_id": newUser._id});
          }
        });
      }
    }
  });
});



app.post("/api/users/:_id/exercises", (req, res) => {
  let userId = req.body[Object.keys(req.body)[0]]
  let descript = req.body.description;
  let time = Number(req.body.duration);
  let date;
  if (req.body.date !== '') {
    date = new Date(req.body.date);
  } else {
    date = new Date(Date.now());
  }
  
  if (descript == '' || time == '' || userId == '') {
    res.json({"error": "invalid fields"});
  } else {
    /*let myWorkout = {
      username,
      description: descript,
      duration: time,
      date: date,
      _id
    };*/
    Users.findOne({_id: userId}, (err, data) => {
      if (err) {return console.error(err);}
      else if (data !== null) {
        let myWorkout = {
          username: data.username,
          description: descript,
          duration: time,
          //_id: userid,
          date: date.toDateString()
        }
        //let newWorkout = new Workout({username: data.username, description: descript, duration: time, date: date, _id: data._id});
        //newWorkout.save((err) => {if (err) return console.error(err)});
        data.workouts = data.workouts.concat(myWorkout);
        data.workouts = data.workouts.sort((a, b) => a.date - b.date);
        data.save((err) => {if (err) return console.error(err)});
        res.json({username: myWorkout.username, description: myWorkout.description, duration: myWorkout.duration, _id: data._id, date: myWorkout.date});
        //res.json(myWorkout);
      } else {
        res.json({"error": "create valid user first"});
      }
    });
  }
});

//make a get request to return all users
app.get("/api/users", (req, res) => {
  Users.find({}, (err, data) => {
    if (err) {return console.error(err);}
    else if (data !== null) {
      res.json(data);
    } else {
      res.json({"error": "no known users"});
    }
  });
});


//get request to retrive full log of exercises
app.get("/api/users/:_id/logs", (req, res) => {
  let userid = req.params[Object.keys(req.params)[0]]
  console.log(req.params._id)
  let from = new Date(req.query.from);
  let to = new Date(req.query.to);
  let limit = Number(req.query.limit);
  
  Users.findOne({_id: userid}, (err, data) => {
    if (err) {return console.error(err);}
    else if (data !== null) {
      let arr = data.workouts;
      
      if (!isNaN(to.getTime()) && !isNaN(from.getTime())) {
        arr = arr.filter((item) => ((item.date <= to) && (item.date >= from)));
      }
      
      if (!isNaN(limit)) {
        arr = arr.slice(0, limit);
      }
      
      let count = arr.length;
      
      res.send({"log": arr, count: count});
      
    } else {
      res.json({"error": "cannot retrieve workout"});
    }
  })
});