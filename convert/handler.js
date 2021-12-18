'use strict'
const logger = require("./winston");

module.exports = async(event, context) => {
  logger.info(JSON.stringify(event.body));
  return context.status(200).succeed();
}
