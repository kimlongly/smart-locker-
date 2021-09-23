const auth = require("./tokencheck");
const router = require("express").Router();
const mongo = require('./database')

router.post("/", async (req, res) => {
  const info = req.body;
  const token = String(info.token);
  const room = String(info.room);
  try {
    const check = await auth.check(token);
    if (check === "senrithney2@gmail.com") {
      const booked = await mongo.db("rooms").collection(room).find().sort({_id:1}).toArray()
      res.send(booked)
    }
    else if (check !== "Unauthorized") {
      const booked = await mongo.db("rooms").collection(room).find().sort({_id:1}).toArray()
      const booked_info = []
      booked.forEach(i => {
        booked_info.push(i._id)
      })
      res.send(booked_info)
    } else {
      res.send("Session expired");
    }
  } catch (error) {
    res.send("Invalid input");
  }
});

module.exports = router;