export default () => ({
  SYSTEM_ACCOUNTS: (process.env.SYSTEM_ACCOUNTS ?? 'reserve,house,rake,prize')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
});
