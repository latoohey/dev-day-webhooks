const express = require('express');
const app = express();
const morgan = require('morgan');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');

app.use(morgan('dev'));
app.use(helmet());

app.use(cors({methods: ['GET,POST']}));


app.use(compress());
app.use(express.json());

app.get('/', (req, res) => res.send('It works!'));

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});



module.exports = app;