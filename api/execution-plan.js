// Vercel serverless function for /api/execution-plan
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
  try {
    await sql.connect(config);
    const planQuery = `SET SHOWPLAN_XML ON; ${query}; SET SHOWPLAN_XML OFF;`;
    const result = await sql.query(planQuery);
    await sql.close();
    res.json({ success: true, plan: result.recordset });
  } catch (error) {
    await sql.close();
    res.status(500).json({ success: false, message: error.message });
  }
}
