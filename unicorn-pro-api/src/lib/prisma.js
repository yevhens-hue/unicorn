const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.pnerikwvvtehclswgstb:y%40Je7%40EuPWd%2Bs%408@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString
    }
  }
});

module.exports = prisma;
