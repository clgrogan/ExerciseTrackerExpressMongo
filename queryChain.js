const queryChain = (done) => {
  console.log("\n\tqueryChain() executing\n")
  const foodToSearch = "burrito";
  const findFoodQuery = Person.find({ favoriteFoods: foodToSearch });
  findFoodQuery
    .sort({ name: 1 })
    .limit(2)
    .select({ age: 0 })
    .exec(function (err, data) {
      if (err) return console.error(err);
      done(null, data);
    });
};
app.get("/api/users/:_id/logs", (req, res) => {
  const { fromDate, toDate, limit } = new Date(req.query);
  const userId = req.params._id;
  let userLogs =
    { username: null, count: 0, _id: userId, log: [] };


  User.findById(userId, function (err, userData) {
    if (err || !userData) {
      res.send("No user found with id \"" + userId + "\".");
    } else {
      console.log("what was found? - " + userData);
      userLogs.username = userData.username;
      const findLogsByUserid = Exercise.find({  userid: userId  });
      Exercise.find({ userid: userId }, function (err, data) {
        if (err) {
          return console.err("Error finding exercise logs: ", err);
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