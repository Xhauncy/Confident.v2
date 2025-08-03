const chalk = require('chalk');

function timestamp() {
  return `[${chalk.gray(new Date().toLocaleTimeString())}]`;
}

const logger = {
  info: (...args) => console.log(`${timestamp()} ${chalk.cyan('[INFO]')} `, ...args),
  warn: (...args) => console.warn(`${timestamp()} ${chalk.yellow('[WARN]')} `, ...args),
  error: (...args) => console.error(`${timestamp()} ${chalk.red('[ERROR]')} `, ...args)
};

module.exports = logger;
