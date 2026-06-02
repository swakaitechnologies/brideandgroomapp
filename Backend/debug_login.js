const axios = require('axios');

async function testLogin(email, password) {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: email,
      password: password
    });
    console.log('Success:', response.status, response.data);
    console.log('Cookies:', response.headers['set-cookie']);
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error Message:', error.message);
    }
  }
}

// Replace with the email from previous step SUCCESS log if you want to be precise, 
// but I'll update the script to take it or just use the one I saw.
testLogin('test1773204132337@example.com', 'Password123!');
