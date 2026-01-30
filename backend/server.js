// server.js - MIRROR PROFESSIONAL BACKEND
// Complete Express API for luxury B2B matchmaking platform

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const { Pool } = require('pg');
const { calculateCompatibility } = require('./matching');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check for deployments
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const normalizeJson = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const buildMirrorProfile = (assessment) => {
  const phase1 = normalizeJson(assessment.phase1_data);
  const phase2 = normalizeJson(assessment.phase2_data);
  const phase3 = normalizeJson(assessment.phase3_data);
  const phase4 = normalizeJson(assessment.phase4_data);

  return {
    ...phase1,
    ...phase2,
    ...phase3,
    ...phase4,
    attachment_style: assessment.attachment_style,
    primary_role_tendency: assessment.primary_role_tendency,
    trauma_load_score: assessment.trauma_load_score,
    regulation_capacity: assessment.regulation_capacity,
    growth_readiness: assessment.growth_readiness,
    ready_to_break: phase3.ready_to_break || assessment.ready_to_break,
    current_frequency: phase4.current_frequency || assessment.current_frequency
  };
};

const buildSurfaceUser = (assessment, phase1) => ({
  age: phase1.age ?? assessment.client_age ?? null,
  min_age: phase1.min_age ?? null,
  max_age: phase1.max_age ?? null,
  max_distance: phase1.max_distance ?? null,
  location_lat: phase1.location_lat ?? phase1.location?.lat ?? phase1.location?.latitude ?? null,
  location_lng: phase1.location_lng ?? phase1.location?.lng ?? phase1.location?.longitude ?? null
});

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Register new matchmaker
app.post('/api/auth/register', async (req, res) => {
  try {
    const { company_name, email, password, tier } = req.body;
    
    // Check if matchmaker exists
    const existing = await pool.query(
      'SELECT * FROM matchmakers WHERE email = $1',
      [email]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Set pricing based on tier
    const pricing = {
      platinum: { price: 499900, limit: 100 },
      elite: { price: 999900, limit: null },
      bespoke: { price: 2500000, limit: null }
    };
    
    const tierPricing = pricing[tier] || pricing.platinum;
    
    // Create matchmaker
    const result = await pool.query(
      `INSERT INTO matchmakers (
        matchmaker_id, company_name, email, password_hash,
        subscription_tier, monthly_price, assessment_limit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING matchmaker_id, company_name, email, subscription_tier`,
      [
        uuidv4(),
        company_name,
        email,
        password_hash,
        tier,
        tierPricing.price,
        tierPricing.limit
      ]
    );
    
    const matchmaker = result.rows[0];
    
    // Generate JWT
    const token = jwt.sign(
      { matchmaker_id: matchmaker.matchmaker_id, email: matchmaker.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      matchmaker_id: matchmaker.matchmaker_id,
      company_name: matchmaker.company_name,
      email: matchmaker.email,
      tier: matchmaker.subscription_tier,
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM matchmakers WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const matchmaker = result.rows[0];
    
    const validPassword = await bcrypt.compare(password, matchmaker.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { matchmaker_id: matchmaker.matchmaker_id, email: matchmaker.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      matchmaker_id: matchmaker.matchmaker_id,
      company_name: matchmaker.company_name,
      tier: matchmaker.subscription_tier,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// DASHBOARD ROUTES
// ============================================

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const matchmaker_id = req.user.matchmaker_id;
    
    // Get matchmaker details
    const matchmaker = await pool.query(
      'SELECT * FROM matchmakers WHERE matchmaker_id = $1',
      [matchmaker_id]
    );
    
    // Get assessment counts
    const assessments = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed,
        COUNT(*) FILTER (WHERE completed_at IS NULL) as in_progress
      FROM client_assessments
      WHERE matchmaker_id = $1`,
      [matchmaker_id]
    );
    
    // Get reports generated
    const reports = await pool.query(
      'SELECT COUNT(*) as total FROM compatibility_reports WHERE matchmaker_id = $1',
      [matchmaker_id]
    );
    
    // This month usage
    const thisMonth = await pool.query(
      `SELECT COUNT(*) as count
      FROM client_assessments
      WHERE matchmaker_id = $1
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
      [matchmaker_id]
    );
    
    res.json({
      subscription: {
        tier: matchmaker.rows[0].subscription_tier,
        monthly_price: matchmaker.rows[0].monthly_price,
        assessment_limit: matchmaker.rows[0].assessment_limit,
        assessments_this_month: matchmaker.rows[0].assessments_this_month
      },
      assessments: {
        total: parseInt(assessments.rows[0].total),
        completed: parseInt(assessments.rows[0].completed),
        in_progress: parseInt(assessments.rows[0].in_progress)
      },
      reports: {
        total: parseInt(reports.rows[0].total)
      },
      usage: {
        this_month: parseInt(thisMonth.rows[0].count),
        limit: matchmaker.rows[0].assessment_limit
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================
// CLIENT MANAGEMENT ROUTES
// ============================================

// Get all clients
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const matchmaker_id = req.user.matchmaker_id;
    const { status } = req.query; // pending, in_progress, completed
    
    let query = `
      SELECT 
        assessment_id,
        client_code,
        client_first_name,
        client_email,
        invitation_sent_at,
        started_at,
        completed_at,
        phase1_complete,
        phase2_complete,
        phase3_complete,
        phase4_complete,
        attachment_style,
        primary_role_tendency
      FROM client_assessments
      WHERE matchmaker_id = $1
    `;
    
    const params = [matchmaker_id];
    
    if (status === 'pending') {
      query += ' AND started_at IS NULL';
    } else if (status === 'in_progress') {
      query += ' AND started_at IS NOT NULL AND completed_at IS NULL';
    } else if (status === 'completed') {
      query += ' AND completed_at IS NOT NULL';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      clients: result.rows.map(client => ({
        ...client,
        status: client.completed_at ? 'completed' : 
                client.started_at ? 'in_progress' : 'pending'
      }))
    });
    
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Invite new client
app.post('/api/clients/invite', authenticateToken, async (req, res) => {
  try {
    const matchmaker_id = req.user.matchmaker_id;
    const { client_code, client_email, client_first_name } = req.body;
    
    // Check usage limit
    const matchmaker = await pool.query(
      'SELECT assessment_limit, assessments_this_month FROM matchmakers WHERE matchmaker_id = $1',
      [matchmaker_id]
    );
    
    const { assessment_limit, assessments_this_month } = matchmaker.rows[0];
    
    if (assessment_limit && assessments_this_month >= assessment_limit) {
      return res.status(403).json({ 
        error: 'Monthly assessment limit reached. Upgrade tier or wait for next month.' 
      });
    }
    
    // Generate magic link token
    const magic_link_token = uuidv4();
    
    // Create assessment
    const result = await pool.query(
      `INSERT INTO client_assessments (
        assessment_id, matchmaker_id, client_code, client_email, 
        client_first_name, magic_link_token, invitation_sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING assessment_id, magic_link_token`,
      [uuidv4(), matchmaker_id, client_code, client_email, client_first_name, magic_link_token]
    );
    
    const assessment = result.rows[0];
    
    // Update usage count
    await pool.query(
      'UPDATE matchmakers SET assessments_this_month = assessments_this_month + 1 WHERE matchmaker_id = $1',
      [matchmaker_id]
    );
    
    // Send invitation email
    const assessmentUrl = `${process.env.APP_URL}/assess/${magic_link_token}`;
    
    await emailTransporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: client_email,
      subject: 'Complete Your Psychological Assessment',
      html: `
        <h2>Hi ${client_first_name},</h2>
        <p>You've been invited to complete your psychological assessment using Mirror Protocol™.</p>
        <p>This comprehensive assessment takes 45-60 minutes and will help create your ideal match.</p>
        <p><a href="${assessmentUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Begin Assessment</a></p>
        <p>Your responses are confidential and will only be shared with your matchmaker.</p>
        <p>Best,<br>Mirror Professional Team</p>
      `
    });
    
    res.status(201).json({
      assessment_id: assessment.assessment_id,
      magic_link: assessmentUrl,
      message: 'Invitation sent successfully'
    });
    
  } catch (error) {
    console.error('Invite client error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get client details
app.get('/api/clients/:assessment_id', authenticateToken, async (req, res) => {
  try {
    const matchmaker_id = req.user.matchmaker_id;
    const { assessment_id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM client_assessments WHERE assessment_id = $1 AND matchmaker_id = $2',
      [assessment_id, matchmaker_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// ============================================
// CLIENT ASSESSMENT ROUTES (MAGIC LINK ACCESS)
// ============================================

// Get assessment by magic link
app.get('/api/assess/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const result = await pool.query(
      `SELECT 
        assessment_id, client_first_name, 
        phase1_complete, phase2_complete, phase3_complete, phase4_complete,
        phase1_data, phase2_data, phase3_data, phase4_data,
        completed_at
      FROM client_assessments 
      WHERE magic_link_token = $1`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid assessment link' });
    }
    
    const assessment = result.rows[0];
    
    // Mark as started if not already
    if (!assessment.started_at) {
      await pool.query(
        'UPDATE client_assessments SET started_at = NOW() WHERE magic_link_token = $1',
        [token]
      );
    }
    
    res.json(assessment);
    
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// Submit assessment phase
app.post('/api/assess/:token/phase:phase', async (req, res) => {
  try {
    const { token, phase } = req.params;
    const phaseData = req.body;
    
    const phaseNum = parseInt(phase);
    if (![1, 2, 3, 4].includes(phaseNum)) {
      return res.status(400).json({ error: 'Invalid phase number' });
    }
    
    // Update phase data
    await pool.query(
      `UPDATE client_assessments 
      SET phase${phaseNum}_data = $1,
          phase${phaseNum}_complete = true,
          completed_at = CASE WHEN $2 = 4 THEN NOW() ELSE completed_at END
      WHERE magic_link_token = $3`,
      [JSON.stringify(phaseData), phaseNum, token]
    );
    
    // If Phase 4 complete, analyze with AI
    if (phaseNum === 4) {
      // TODO: Call OpenAI to analyze full assessment
      // For now, set basic scores
      await pool.query(
        `UPDATE client_assessments 
        SET 
          attachment_style = 'secure',
          primary_role_tendency = 'balanced',
          trauma_load_score = 50,
          regulation_capacity = 70,
          growth_readiness = 75
        WHERE magic_link_token = $1`,
        [token]
      );
    }
    
    res.json({ 
      success: true, 
      phase_complete: phaseNum,
      all_complete: phaseNum === 4
    });
    
  } catch (error) {
    console.error('Submit phase error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// ============================================
// COMPATIBILITY ROUTES
// ============================================

// Generate compatibility report
app.post('/api/compatibility/generate', authenticateToken, async (req, res) => {
  try {
    const matchmaker_id = req.user.matchmaker_id;
    const { client_a_id, client_b_id, template } = req.body;
    
    // Fetch both assessments
    const [clientA, clientB] = await Promise.all([
      pool.query(
        'SELECT * FROM client_assessments WHERE assessment_id = $1 AND matchmaker_id = $2',
        [client_a_id, matchmaker_id]
      ),
      pool.query(
        'SELECT * FROM client_assessments WHERE assessment_id = $1 AND matchmaker_id = $2',
        [client_b_id, matchmaker_id]
      )
    ]);
    
    if (clientA.rows.length === 0 || clientB.rows.length === 0) {
      return res.status(404).json({ error: 'Client(s) not found' });
    }
    
    const mirrorA = clientA.rows[0];
    const mirrorB = clientB.rows[0];
    
    const mirrorAProfile = buildMirrorProfile(mirrorA);
    const mirrorBProfile = buildMirrorProfile(mirrorB);
    const phase1A = normalizeJson(mirrorA.phase1_data);
    const phase1B = normalizeJson(mirrorB.phase1_data);
    const surfaceA = buildSurfaceUser(mirrorA, phase1A);
    const surfaceB = buildSurfaceUser(mirrorB, phase1B);

    const compatibilityResult = await calculateCompatibility(
      surfaceA,
      surfaceB,
      mirrorAProfile,
      mirrorBProfile
    );

    const compatibility = {
      predicted_role_lock: compatibilityResult.predicted_dynamics?.role_lock || null,
      activation_probability: compatibilityResult.predicted_dynamics?.activation_probability || 0,
      risk_score: compatibilityResult.predicted_dynamics?.risk_level || 0,
      growth_potential: compatibilityResult.predicted_dynamics?.growth_potential || 0,
      surface_score: compatibilityResult.breakdown?.surface ?? compatibilityResult.surface_score ?? 0,
      attachment_score: compatibilityResult.breakdown?.attachment ?? 0,
      trauma_overlap_score: compatibilityResult.breakdown?.trauma_overlap ?? 0,
      values_score: compatibilityResult.breakdown?.values ?? 0,
      overall_score: compatibilityResult.overall_score ?? 0,
      red_flags: compatibilityResult.flags?.red || [],
      yellow_flags: compatibilityResult.flags?.yellow || [],
      green_lights: compatibilityResult.flags?.green || []
    };
    
    // Save report
    const report = await pool.query(
      `INSERT INTO compatibility_reports (
        report_id, matchmaker_id, client_a_id, client_b_id,
        predicted_role_lock, activation_probability, risk_score, growth_potential,
        surface_score, attachment_score, trauma_overlap_score, values_score, overall_score,
        red_flags, yellow_flags, green_lights, report_template
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING report_id`,
      [
        uuidv4(), matchmaker_id, client_a_id, client_b_id,
        compatibility.predicted_role_lock, compatibility.activation_probability,
        compatibility.risk_score, compatibility.growth_potential,
        compatibility.surface_score, compatibility.attachment_score,
        compatibility.trauma_overlap_score, compatibility.values_score,
        compatibility.overall_score,
        JSON.stringify(compatibility.red_flags),
        JSON.stringify(compatibility.yellow_flags),
        JSON.stringify(compatibility.green_lights),
        template || 'luxury'
      ]
    );
    
    res.status(201).json({
      report_id: report.rows[0].report_id,
      compatibility,
      predicted_dynamics: compatibilityResult.predicted_dynamics
    });
    
  } catch (error) {
    console.error('Generate compatibility error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get compatibility report
app.get('/api/compatibility/:report_id', authenticateToken, async (req, res) => {
  try {
    const matchmaker_id = req.user.matchmaker_id;
    const { report_id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM compatibility_reports WHERE report_id = $1 AND matchmaker_id = $2',
      [report_id, matchmaker_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Mark as viewed
    await pool.query(
      'UPDATE compatibility_reports SET viewed_by_matchmaker = true WHERE report_id = $1',
      [report_id]
    );
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   MIRROR PROFESSIONAL API                  ║
║   Luxury B2B Matchmaking Platform          ║
║   Port: ${PORT}                               ║
║   Status: LIVE                             ║
╚════════════════════════════════════════════╝
  `);
});
