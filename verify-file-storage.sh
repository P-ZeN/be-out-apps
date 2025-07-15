#!/bin/bash
# File Storage Verification Script
# Run this after deployment to verify file storage is working

echo "🔍 Verifying BeOut File Storage Setup..."

# Check if upload directory exists
echo "📁 Checking upload directories..."
if [ -d "/app/uploads" ]; then
    echo "✅ Upload directory exists"
    ls -la /app/uploads/
else
    echo "❌ Upload directory missing"
fi

# Check permissions
echo "🔐 Checking permissions..."
ls -la /app/ | grep uploads

# Test file creation
echo "📝 Testing file creation..."
echo "test" > /app/uploads/test.txt && echo "✅ File write successful" || echo "❌ File write failed"

# Test database connection
echo "🗄️ Testing database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected:', res.rows[0].now);
    }
    pool.end();
});
"

# Check file storage tables
echo "📊 Checking file storage tables..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM uploaded_files', (err, res) => {
    if (err) {
        console.log('❌ uploaded_files table missing:', err.message);
    } else {
        console.log('✅ uploaded_files table exists, count:', res.rows[0].count);
    }
    pool.end();
});
"

echo "🎉 Verification complete!"
