const cors = require('cors');

const corsOptions = {
  origin: "https://frontend-social-media-hsstw3es4-gurusewak-singhs-projects.vercel.app/",
  credentials: true,
};

module.exports = cors(corsOptions);
