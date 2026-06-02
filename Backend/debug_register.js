const axios = require('axios');

async function testRegister() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      firstName: "Test",
      lastName: "User",
      email: "test" + Date.now() + "@example.com",
      password: "Password123!",
      mobile: "123456" + (Math.floor(Math.random() * 9000) + 1000),
      createdBy: "Self",
      dateOfBirth: "1995-01-01",
      agreedToTerms: true,
      is18Plus: true,
      gender: "Male",
      country: "India"
    }, {
      headers: {
        'X-Mobile-App': 'true'
      }
    });
    console.log('Success:', response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error Message:', error.message);
    }
  }
}

testRegister();
