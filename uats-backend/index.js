const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/citizens', require('./routes/citizens'));
app.use('/api/users', require('./routes/users'));
app.use('/api/fines', require('./routes/fines'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/payments', require('./routes/payments'));

app.get('/', (req, res) => {
  res.send('Umuganda Backend API is running!');
});

const PORT = process.env.PORT || 5000;

// Connect to DB, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
