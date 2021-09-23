const Stripe = require("stripe");
const mongo = require('./database');
const auth = require("./tokencheck");
const router = require("express").Router();
const moment = require("moment");
const stripe = Stripe(
  "sk_test_51IexyyBKrV1kiD7pqBLJ04o8hc8cv9WrycnCqFOi86FBAYuLCTfuxFN9KUzTjVzUej58WxuMSbU6P2TVWKopXi5U00k8ODZ0mv"
);

router.post('/add_date', async (req,res)=>{
    const db = await mongo.db("lockers").stats();
    const num_lockers = db.collections;
    const info = req.body;
    if (
        info.email &&
        info.num_date &&
        info.card_number &&
        info.token &&
        info.cvc &&
        info.exp_year &&
        info.exp_month
      ){
        const email = info.email;
        const num_date = info.num_date;
        const token = info.token;
        const card_number = info.card_number;
        const cvc = info.cvc;
        const exp_year = info.exp_year;
        const exp_month = info.exp_month;
        let check = await auth.check(token);
        let locker_found = false;
    if(check != 'Unauthorized'){
    try{
        for (i=1 ; i<=num_lockers;i++){
        const locker = await mongo
        .db('lockers')
        .collection(String(i))
        .findOne({'email':email});
    if(locker != null){
        locker_number = i;
        locker_found = true;
        break;
    }}
    if(locker_found){
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
            description: "Add Date",
            source: token.id,
          });
          const db = await mongo.db('lockers').collection(String(locker_number)).findOne({});
          const old_date = db.end_date;
          const new_date = moment(old_date, 'MMMM Do YYYY, h:mm:ss a').add( num_date,'days').format('MMMM Do YYYY, h:mm:ss a');
          await mongo
            .db("lockers")
            .collection(String(locker_number))
            .findOneAndUpdate({ 'email': email }, { $set: { 'end_date': new_date } });
          await mongo
          .db('users')
          .collection(email)
          .findOneAndUpdate({'end_date':old_date},{$set:{'end_date':new_date}});
        res.send("Transaction successful");
    }else{
        res.send("You have no Locker");
    }
}catch(error){
    console.log(error); 
}
}else{
    res.send("Access Denied");
}
}else{
    res.send("Invalid Input");
}});

module.exports = router;