const cors = require('cors');

const corsOptions = {
  origin: "https://frontend-social-media-one.vercel.app",
  credentials: true,
};

module.exports = cors(corsOptions);
