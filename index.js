// @ts-check
require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const helmet = require('helmet');
app.use(helmet.contentSecurityPolicy({
    directives: {
        "frame-ancestors": ["'self'", "http://localhost:3000", "http://localhost:1234"]
    }
}))
app.use(cors());

app.use(express.json());

app.use(require('./routes/auth.route'));

app.use(express.static('./static'));

app.all((req, res) => {
    res.sendStatus(404);
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on Port: ${process.env.PORT || 3000}`);
});