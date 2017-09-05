const config = require('./post-css-replace-color-config.json');

module.exports = {
  plugins: [
    require('./post-css-replace-color.js')(config)
  ]
};