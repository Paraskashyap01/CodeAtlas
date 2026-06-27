import axios from 'axios';

const run = async () => {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/auth/register',
      {
        email: `testuser${Date.now()}@example.com`,
        password: 'password123',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:5173',
        },
      }
    );

    console.log('STATUS', response.status);
    console.log('DATA', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('STATUS', error.response.status);
      console.error('DATA', JSON.stringify(error.response.data, null, 2));
      console.error('ERROR MESSAGE', error.message);
      console.error('ERROR STACK', error.stack);
    } else {
      console.error('ERROR', error);
    }
  }
};

run();
