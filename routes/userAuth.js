
const mongo = require('../database');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const router = require("express").Router();
const auth = require("../tokencheck");
const randomstring = require("randomstring");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "senrithney5@gmail.com",
    pass: "Galaticdog1!",
  },
});

router.post("/login", async (req, res) => {
  const info = req.body;
  if (info.email && info.password) {
    const email = String(info.email);
    const password = String(info.password);
    try {
      const user = await mongo
        .db("users")
        .collection(email)
        .findOne({ _id: "info" });
      if (user) {
        let check = await bcrypt.compare(password, user.password);
        if (check) {
          const token = jwt.sign({ email: email }, "trytoguessthis", {
            expiresIn: "1h",
          });
          res.send({ token: token });
        } else {
          res.send("Unauthorized");
        }
      } else {
        res.send("User does not exist");  
      }
    } catch (error) {
      res.send(error);
    }
  } else {
    res.send("Invalid input");
  }
});

router.post("/register", async (req, res) => {
  const info = req.body;
  if (info.email && info.password) {
    const email = String(info.email);
    const password = String(info.password);
    try {
      const user = await mongo
        .db("users")
        .collection(email)
        .findOne({ _id: "info" });
      
      if (!user) {
        let hash = await bcrypt.hash(password, 10);
        await mongo.db("users").createCollection(email);
        await mongo.db("users").collection(email).insertOne({
          _id: "info",
          password: hash,
        });
        const token = jwt.sign({ email: email }, "trytoguessthis", {
          expiresIn: "1h",
        });
        res.send({ token: token });
      } else {
        res.send("User already exist");
      }
    } catch (error) {
      res.send(error);
    }
  } else {
    res.send("Invalid input");
  }
});

router.post("/change_password", async (req, res) => {
  const info = req.body;
  const token = String(info.token);
  const password = String(info.password);
  const new_password = String(info.new_password);
  const check = await auth.check(token);
  try {
    if (check !== "Unauthorized") {
      const user = await mongo
        .db("users")
        .collection(check)
        .findOne({ _id: "info" });
      if (user) {
        let auth = await bcrypt.compare(password, user.password);
        if (auth) {
          let hash = await bcrypt.hash(new_password, 10);
          const update = await mongo
            .db("users")
            .collection(check)
            .findOneAndUpdate({ _id: "info" }, { $set: { password: hash } });
          res.send("Password changed");
        } else {
          res.send("Wrong password");
        }
      } else {
        res.send("User does not exist");
      }
    }
    else {
      res.send("Session expired")
    }
  } catch (error) {
    res.send("Invalid input");
  }
});

router.post("/reset_password", async (req, res) => {
  const info = req.body;
  const email = String(info.email);
  try {
    const user = await mongo
      .db("users")
      .collection(email)
      .findOne({ _id: "info" });
    if (user) {
      const reset_code = randomstring.generate(4);
      const reset = await mongo
        .db("users")
        .collection(email)
        .findOneAndUpdate(
          { _id: "info" },
          { $set: { reset_code: reset_code } }
        );
      let mailOptions = {
        from: "senrithney5@gmail.com",
        to: email,
        subject: "Reset password",
        text: "Reset code: " + reset_code,
      };
      let sent = await transporter.sendMail(mailOptions);
      res.send("Reset code has been sent to email");
    } else {
      res.send("User does not exist");
    }
  } catch (error) {
    res.send("Invalid input");
  }
});

router.post("/reset_password_confirm", async (req, res) => {
  const info = req.body;
  const email = String(info.email);
  const reset_code = String(info.reset_code);
  try {
    const user = await mongo
      .db("users")
      .collection(email)
      .findOne({ _id: "info" });
    if (user) {
      if (reset_code == user.reset_code) {
        const password = randomstring.generate(20);
        let hash = await bcrypt.hash(password, 10);
        await mongo
          .db("users")
          .collection(email)
          .findOneAndUpdate({ _id: "info" }, { $set: { password: hash } });
        let mailOptions = {
          from: "senrithney5@gmail.com",
          to: email,
          subject: "New password",
          text: "New password: " + password,
        };
        await transporter.sendMail(mailOptions);
        res.send("Reset code has been sent to email");
      } else {
        res.send("Invalid input")
      }
    } else {
      res.send("User does not exist");
    }
  } catch (error) {
    res.send("Invalid input");
  }
});

module.exports = router;
