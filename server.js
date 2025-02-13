const express = require('express');
const sequelize = require('./db/db.config');
const routes = require('./routes');
const dotenv = require('dotenv').config();
const cors = require('cors');
const path = require('path'); // Import path module

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.DB_SYNC === 'true') {
  sequelize.sync({ alter: true })
    .then(() => {
      console.log('Database synchronized');
    })
    .catch((error) => {
      console.error('Database synchronization failed:', error.message);
    });
}

// API Routes
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Uploads available at http://localhost:${PORT}/uploads`);
});
