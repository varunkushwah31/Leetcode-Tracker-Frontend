const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function syncStudents() {
    try {
        console.log('--- Starting Student Sync Job ---');
        
        // 1. Login to get Admin Token
        console.log(`Logging in as ${ADMIN_EMAIL}...`);
        const loginResponse = await axios.post(`${BACKEND_URL}/api/v1/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        const token = loginResponse.data.accessToken;
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        console.log('Login successful.');

        // 2. Fetch all students
        console.log('Fetching students list...');
        const studentsResponse = await axios.get(`${BACKEND_URL}/api/students`, authHeader);
        const students = studentsResponse.data;
        console.log(`Found ${students.length} students.`);

        // 3. Batch processing (25 at a time)
        const batchSize = 25;
        const delayMs = 2 * 60 * 1000; // 2 minutes

        for (let i = 0; i < students.length; i += batchSize) {
            const batch = students.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} students)...`);

            // Sync students in the current batch in parallel
            const syncPromises = batch.map(student => {
                console.log(`Syncing: ${student.leetcodeUsername}`);
                return axios.post(`${BACKEND_URL}/api/students/${student.leetcodeUsername}/sync`, {}, authHeader)
                    .then(() => console.log(`SUCCESS: ${student.leetcodeUsername}`))
                    .catch(err => console.error(`FAILED: ${student.leetcodeUsername}`, err.message));
            });

            await Promise.all(syncPromises);

            // If there are more students, wait for the gap
            if (i + batchSize < students.length) {
                console.log(`Waiting ${delayMs / 1000} seconds for the next batch...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        console.log('--- All batches processed ---');

    } catch (error) {
        console.error('CRITICAL ERROR in sync job:', error.response?.data || error.message);
        process.exit(1);
    }
}

syncStudents();
