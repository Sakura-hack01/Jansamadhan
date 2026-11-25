const { query } = require('../config/database');

// @desc    Get summary report
// @route   GET /api/reports/summary
// @access  Private (Admin)
exports.getSummaryReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;

    const cConds = [];
    const cParams = [];
    let i = 1;

    if (startDate) { cConds.push(`c.created_at >= $${i++}`); cParams.push(new Date(startDate)); }
    if (endDate) { cConds.push(`c.created_at <= $${i++}`); cParams.push(new Date(endDate)); }
    if (department) { cConds.push(`c.department_id = $${i++}`); cParams.push(department); }

    const cWhere = cConds.length ? `WHERE ${cConds.join(' AND ')}` : '';

    const dConds = [];
    const dParams = [];
    let di = 1;
    if (startDate) { dConds.push(`created_at >= $${di++}`); dParams.push(new Date(startDate)); }
    if (endDate) { dConds.push(`created_at <= $${di++}`); dParams.push(new Date(endDate)); }
    const dWhere = dConds.length ? `WHERE ${dConds.join(' AND ')}` : '';

    const totalComplaints = (await query(`SELECT COUNT(*)::int AS cnt FROM complaints c ${cWhere}`, cParams)).rows[0].cnt;
    const totalUsers = (await query(`SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'user'`)).rows[0].cnt;
    const totalOfficers = (await query(`SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'officer'`)).rows[0].cnt;
    const totalDeliveries = (await query(`SELECT COUNT(*)::int AS cnt FROM deliveries ${dWhere}`, dParams)).rows[0].cnt;

    const complaintsByStatus = (
      await query(`SELECT c.status AS "_id", COUNT(*)::int AS count FROM complaints c ${cWhere} GROUP BY c.status`, cParams)
    ).rows;

    const complaintsByDept = (
      await query(
        `SELECT d.name, COUNT(*)::int AS count
         FROM complaints c
         JOIN departments d ON c.department_id = d.id
         ${cWhere}
         GROUP BY d.id, d.name
         ORDER BY count DESC`,
        cParams
      )
    ).rows;

    const avgRes = (
      await query(
        `SELECT AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 86400.0) AS avg_days
         FROM complaints c
         ${cWhere ? `${cWhere} AND` : 'WHERE'} c.status = 'resolved' AND c.resolved_at IS NOT NULL`,
        cParams
      )
    ).rows[0];

    const complaintTrend = (
      await query(
        `SELECT to_char(date_trunc('day', c.created_at), 'YYYY-MM-DD') AS "_id", COUNT(*)::int AS count
         FROM complaints c
         ${cWhere ? `${cWhere} AND` : 'WHERE'} c.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY date_trunc('day', c.created_at)
         ORDER BY "_id" ASC`,
        cParams
      )
    ).rows;

    const priorityBreakdown = (
      await query(`SELECT c.priority AS "_id", COUNT(*)::int AS count FROM complaints c ${cWhere} GROUP BY c.priority`, cParams)
    ).rows;

    res.json({
      success: true,
      data: {
        overview: { totalComplaints, totalUsers, totalOfficers, totalDeliveries },
        complaintsByStatus,
        complaintsByDept,
        avgResolutionDays: avgRes?.avg_days ? Number(avgRes.avg_days).toFixed(1) : 0,
        complaintTrend,
        priorityBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department-wise report
// @route   GET /api/reports/departments
// @access  Private (Admin)
exports.getDepartmentReport = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT d.id AS "_id", d.name, d.code,
        COUNT(c.id)::int AS total,
        COUNT(*) FILTER (WHERE c.status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE c.status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE c.status = 'in_progress')::int AS "inProgress"
      FROM departments d
      LEFT JOIN complaints c ON c.department_id = d.id
      GROUP BY d.id, d.name, d.code
      ORDER BY total DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get officer performance report
// @route   GET /api/reports/officers
// @access  Private (Admin)
exports.getOfficerReport = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT u.id AS "_id", u.name, u.email, u.department_id AS department,
        COUNT(c.id)::int AS "totalAssigned",
        COUNT(*) FILTER (WHERE c.status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE c.status IN ('pending', 'assigned', 'in_progress'))::int AS pending
      FROM users u
      LEFT JOIN complaints c ON c.assigned_officer_id = u.id
      WHERE u.role = 'officer'
      GROUP BY u.id, u.name, u.email, u.department_id
      ORDER BY resolved DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};
