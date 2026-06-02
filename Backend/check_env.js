require('dotenv').config({ path: './.env' });
console.log('ENV CHECK:');
console.log('PORT:', process.env.PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
console.log('NODE_ENV:', process.env.NODE_ENV);
