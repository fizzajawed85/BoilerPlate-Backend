const axios = require('axios');

async function testRegister() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            username: 'testuser789',
            email: 'testuser789@test.com',
            password: 'Test@123'
        });
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testRegister();
