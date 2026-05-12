const User = require('./src/models/User');
const { connectDB } = require('./src/config/database');

async function cleanup() {
  await connectDB();
  try {
    // Delete test users (starting with test) or just all users if it's a dev db
    // Let's be safe and delete those I created
    const count = await User.destroy({
      where: {
        email: {
          [require('sequelize').Op.like]: 'test%@example.com'
        }
      }
    });
    console.log(`Deleted ${count} test users.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

cleanup();
