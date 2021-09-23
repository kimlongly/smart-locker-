const dotenv = require('dotenv');
dotenv.config();

const MongoClient = require("mongodb").MongoClient;
const client = new MongoClient(process.env.DB_Connect, { useUnifiedTopology: true });
async function run() {
    try {
        await client.connect();
        console.log("Connected")
    }
    catch (error) {
        console.log(error.message)
    }
}
run()
module.exports = client;