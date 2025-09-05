require('ts-node/register');
const {
  detectSharedIP,
  detectChipDump,
  detectSynchronizedBetting,
} = require('../../shared/analytics/collusion');

module.exports = {
  detectSharedIP,
  detectChipDump,
  detectSynchronizedBetting,
};
