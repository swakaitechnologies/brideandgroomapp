const { sequelize } = require('./src/config/database');
(async () => {
  try {
    const desc = await sequelize.getQueryInterface().describeTable('Users');
    console.log(JSON.stringify(desc, null, 2));
  } catch (err) { console.error(err); }
  finally { process.exit(0); }
})();
