// Vercel serverless function for /api/execute-sql
import sql from 'mssql';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { server, database, username, password, query } = req.body;
  const config = {
    server,
    database,
    user: username,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true
    }
  };
  const startTime = Date.now();
  try {
    await sql.connect(config);
    const result = await sql.query(query);
    const executionTime = Date.now() - startTime;
    const rowCount = result.recordset ? result.recordset.length : 0;
    let executionPlan = null;
    if (query.includes('STATISTICS')) {
      executionPlan = {
        info: result.info || 'Statistics enabled',
        rowsAffected: result.rowsAffected
      };
    }
    await sql.close();
    res.json({ success: true, executionTime, rowCount, executionPlan });
  } catch (error) {
    await sql.close();
    res.status(500).json({ success: false, message: error.message });
  }
}
