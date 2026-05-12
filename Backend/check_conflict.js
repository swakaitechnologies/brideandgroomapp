const { User } = require('./src/models/associations');
const { sequelize } = require('./src/config/database');

async function checkAndFix() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const email = 'bad@gmail.com';
    const mobile = '8007240898';

    const conflict = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ email }, { mobile }]
      }
    });

    if (conflict) {
      console.log('CONFLICT FOUND:', {
        id: conflict.id,
        email: conflict.email,
        mobile: conflict.mobile
      });
      // Optionally delete to allow re-registration
      // await conflict.destroy();
      // console.log('Conflict deleted.');
    } else {
      console.log('No conflict found for:', { email, mobile });
    }

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkAndFix();
