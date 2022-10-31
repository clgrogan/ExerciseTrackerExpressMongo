const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require("body-parser");

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schemas
const Schema = mongoose.Schema;
const exerciseSchema = new Schema({
  userid: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});
const userSchema = new Schema({
  username: String
});
const logSchema = new Schema({
  username: String,
  // userid: {type: mongoose.ObjectIds, required: true}
});

// Models
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

// mount up
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

// get some
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      console.error("Oops! Something went wrong \n", err);
      res.send("Oops! Something went wrong when attempting retrieve users... \n", err);
    } else if (!data) {
      console.error("No users found!!!");
      res.send("No users found!!!");
    } else {
      res.json(data);
    }
    return;
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  console.log("\n!!!\n/api/users/:_id/logs");
  console.log("req.params ", req.params);
  console.log("req.body ", req.body);
  console.log("req.query ", req.query);
  const queryDate = {};
  const dateQueryString = (req.query.from || req.query.to) ? ("date: ", queryDate) : "";
  console.log("dateQueryString: ", dateQueryString);
  const fromDate = req.query.from;
  const toDate = req.query.to;
  const limit = req.query.limit ? new Number(req.query.limit) : new Number(1000);
  const userId = req.params._id;
  let userLogs =
    { username: null, count: 0, _id: userId, log: [] };

  User.findById(userId, function (err, userData) {
    if (err || !userData) {
      res.send("No user found with id \"" + userId + "\".");
    } else {
      console.log("what was found? - " + userData);
      userLogs.username = userData.username;
      // res.json(userLogs);
      // experiment
      const exerciseFilter = buildExerciseFilter(userId, fromDate, toDate);
      console.log("\n\nexerciseFilter:\n\t", exerciseFilter);
      const findLogsByUserid = Exercise.find(exerciseFilter);
      // date: {$gte: d.getTime()}
      // .select({date:  { '$gte': new Date("Thu, 02 Apr 2020 14:59:38 GMT") } })
      findLogsByUserid.limit(limit).exec(function (err, data) {
        // experiment end
        // Exercise.find({ userid: userId }, function (err, data) {
        if (err) {
          return console.error("Error finding exercise logs: ", err);
        } else {
          // console.error(data);
          for (i = 0; i < data.length; i++) {
            console.log(data[i]);
            userLogs.count = userLogs.log.push({
              description: data[i].description,
              duration: data[i].duration,
              date: data[i].date.toDateString()
            });
          }
          res.json(userLogs);
        }
      });
    }
  });
});

// post up
app.post("/api/users", (req, res) => {
  console.log("req.body ", req.body);
  const user = new User({ username: req.body.username }); //matches input name attribute

  user.save((err, data) => {
    if (err) {
      console.error("Oops! Something went wrong \n", err);
      res.send("Oops! Something went wrong when attempting to save user... \n", err);
    } else {
      res.send(data);
    }
    return;
  });
});
app.post("/api/users/:_id/exercises", (req, res) => {
  console.log("req.params ", req.params);
  console.log("\nreq.body ", req.body);
  const userId = req.params._id;
  const description = req.body.description;
  const duration = new Number(req.body.duration);
  let date = new Date(req.body.date);
  if (isNaN(date)) date = new Date();

  User.findById(userId, function (err, userData) {
    if (err || !userData) {
      res.send("No user found with id \"" + userId + "\".");
    } else {
      console.log("what was found? - " + userData);

      let exercise = new Exercise({
        userid: userId,
        description: description,
        duration: duration,
        date: date
      });
      console.log("local object populated: " + exercise);
      exercise.save(function (err, data) {
        if (err) {
          res.send("An error occured attempting to save exercise record for \"" + userId + "\".");
        } else {
          res.json({
            username: userData.username,
            duration: duration,
            description: description,
            date: date.toDateString(),
            _id: userId
          });
        }
      });
    }

  });

});

const buildExerciseFilter = (userId, from, to) => {
  let filter = {};
  filter.userid = userId;
  let dateQuery = new Object();
  console.log("\nbuildExerciseFilter from: ", from,
  "\n\tnew Date(from): ",new Date(from));
  if (from)
    dateQuery["$gte"] = new Date(from);
  if (to)
    dateQuery["$lte"] = new Date(to);
    if (from || to) filter.date = dateQuery;

  return filter;
}



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
