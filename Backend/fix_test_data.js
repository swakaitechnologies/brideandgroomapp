const { User } = require('./src/models/associations');
const { sequelize } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function fixData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const email = 'badgujar282@gmail.com';
    const newPassword = 'Password123!';

    const user = await User.findOne({ where: { email } });
    if (user) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      await user.save();
      console.log(`✅ Password reset for ${email} to "${newPassword}"`);
    } else {
      console.log(`❌ User ${email} not found.`);
    }

    // Attempt to clear any conflicting 'bad@gmail.com' if it partially exists
    const badUser = await User.findOne({ where: { email: 'bad@gmail.com' } });
    if (badUser) {
        await badUser.destroy();
        console.log('✅ Deleted partial bad@gmail.com registration');
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

fixData();
