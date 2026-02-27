const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgresql://journal_db_g8j3_user:DKY80gMCwA81f6DCjCokO2XhkmSvWBuO@dpg-d51fotdactks73b02hmg-a/journal_db_g8j3',
    ssl: { rejectUnauthorized: false }
});

async function resetPassword() {
    try {
        const email = 'ipadpeda@gmail.com';
        const newPassword = 'NuovaPassword123!';

        console.log(`Hashing new password...`);
        const passwordHash = await bcrypt.hash(newPassword, 10);

        console.log(`Updating database for user ${email}...`);
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
            [passwordHash, email]
        );

        if (result.rows.length > 0) {
            console.log('Password successfully reset!');
            console.log(`User ID: ${result.rows[0].id}`);
            console.log(`Email: ${result.rows[0].email}`);
        } else {
            console.log('User not found!');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await pool.end();
    }
}

resetPassword();
