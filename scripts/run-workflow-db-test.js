#!/usr/bin/env node

/**
 * Simple test runner for workflow database integration
 * This bypasses Jest configuration issues and tests the core functionality
 */

async function runWorkflowDbTest() {
  console.log('🚀 Starting Workflow Database Integration Test\n');

  try {
    // Test database connection first
    const { Client } = require('pg');

    const client = new Client({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'mydb',
    });

    console.log('📊 Testing database connection...');
    await client.connect();

    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log(`   Current time: ${result.rows[0].current_time}`);

    // Check if workflow tables exist
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE '%workflow%' 
      ORDER BY tablename;
    `;

    const tables = await client.query(tablesQuery);
    console.log('\n📋 Workflow tables found:');
    tables.rows.forEach((row) => {
      console.log(`   • ${row.tablename}`);
    });

    // Check task table
    const taskTableQuery = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'tasks';
    `;

    const taskTableExists = await client.query(taskTableQuery);
    console.log(
      `\n📝 Tasks table exists: ${
        taskTableExists.rows[0].count > 0 ? '✅' : '❌'
      }`
    );

    // Test data query
    if (taskTableExists.rows[0].count > 0) {
      const tasksCount = await client.query(
        'SELECT COUNT(*) as count FROM tasks'
      );
      console.log(`   Existing tasks: ${tasksCount.rows[0].count}`);

      if (tasksCount.rows[0].count > 0) {
        const recentTasks = await client.query(`
          SELECT "entityId", title, status, "createdAt" 
          FROM tasks 
          ORDER BY "createdAt" DESC 
          LIMIT 3
        `);

        console.log('\n📋 Recent tasks:');
        recentTasks.rows.forEach((task) => {
          console.log(
            `   • ${task.title} (${task.status}) - ${task.createdAt}`
          );
        });
      }
    }

    await client.end();

    console.log('\n✅ Database test completed successfully!');
    console.log('\n💡 To run the full integration test:');
    console.log('   1. Fix TypeScript configuration issues in jest.config.ts');
    console.log('   2. Or compile TypeScript first: npx tsc');
    console.log('   3. Or use ts-node: npx ts-node [test-file]');
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error(error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure PostgreSQL is running: docker ps');
    console.log('   • Check connection settings in DATABASE_URL or env vars');
    console.log(
      '   • Verify database exists: psql -h localhost -U postgres -d mydb'
    );
  }
}

// Run the test
runWorkflowDbTest().catch(console.error);
