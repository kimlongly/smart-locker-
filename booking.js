const auth = require("./tokencheck");
const router = require("express").Router();
const mongo = require("./database");
const randomstring = require("randomstring");
const Stripe = require("stripe");
const moment = require("moment");
const stripe = Stripe(
  "sk_test_51IexyyBKrV1kiD7pqBLJ04o8hc8cv9WrycnCqFOi86FBAYuLCTfuxFN9KUzTjVzUej58WxuMSbU6P2TVWKopXi5U00k8ODZ0mv"
);
router.post("/book", async (req, res) => {
  const db = await mongo.db("lockers").stats();
  const num_lockers = db.collections;
  const info = req.body; 
  if (
    info.num_date &&
    info.card_number &&
    info.token &&
    info.cvc &&
    info.exp_year &&
    info.exp_month
  ) {
    const today = moment().format('MMMM Do YYYY, h:mm:ss a');
    const num_date = info.num_date;
    const token = info.token;
    const card_number = info.card_number;
    const cvc = info.cvc;
    const exp_year = info.exp_year;
    const exp_month = info.exp_month;
    const end_date = moment().add(num_date, 'days').format('MMMM Do YYYY, h:mm:ss a');
    let check = await auth.check(token);
    if (check != "Unauthorized") {
      try {
      let locker_avail = false;
      for (i=1; i<= num_lockers ; i++){
          const locker = await mongo
            .db("lockers")
            .collection(String(i))
            .findOne({});
          if(locker == null ){
            locker_number = i;
            locker_avail = true;
            break;
          }
      }
          if (locker_avail) {
            const token = await stripe.tokens.create({
              card: {
                number: card_number,
                cvc: cvc,
                exp_month: exp_month,
                exp_year: exp_year,
              },
            });
            let amount = 100 * num_date;
            const charge = await stripe.charges.create({
              amount: amount,
              currency: "usd",
              description: "Locker renting",
              source: token.id,
            });
            const code = randomstring.generate(25);
            data = {
              
              locker_number : locker_number,
              start_date: today,
              end_date: end_date,
              email: check,
              qr_code: code,
            };
            await mongo.db("lockers").collection(String(locker_number)).insertOne(data);
            await mongo
              .db("users")
              .collection(check)
              .insertOne(data
                // { "locker_number": String(locker_number) },
                // { $addToSet: { booked: data } },
                // { upsert: 1 }
              );
            res.send(code);
          } else {
            res.send("Lockers not availible");
          }
      } catch (error) {
        res.send(error.message);
      }
    } else {
      res.send("Session expired");
    }
  } else {
    res.send("Inputs not filled");
  }
});

module.exports = router;
