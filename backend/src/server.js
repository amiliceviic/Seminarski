// server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

const DB_HOST = process.env.DB_HOST || 'db';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_NAME = process.env.DB_NAME || 'appdb';
const DB_USER = process.env.DB_USER || 'appuser';
const DB_PASSWORD = process.env.DB_PASSWORD || 'apppass';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

/** Init: create table if missing */
async function init() {
  const sql = `
    CREATE TABLE IF NOT EXISTS contacts (
      id           VARCHAR(12) PRIMARY KEY,
      first_name   VARCHAR(100) NOT NULL,
      last_name    VARCHAR(100) NULL,
      email        VARCHAR(190) NOT NULL,
      phone        VARCHAR(50)  NULL,
      company      VARCHAR(150) NULL,
      avatar_url   VARCHAR(500) NULL,
      notes        TEXT         NULL,
      created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_contacts_email (email),
      INDEX idx_contacts_name (first_name, last_name),
      INDEX idx_contacts_company (company)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
  `;
  await pool.query(sql);
  console.log('DB ready (contacts table)');
}
init().catch((err) => {
  console.error('DB init error:', err);
  process.exit(1);
});

/** Health */
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.send('OK');
  } catch {
    res.status(500).send('DB down');
  }
});

/**
 * Helpers
 */
function mapRow(r) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    company: r.company,
    avatarUrl: r.avatar_url,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * List contacts (optional search ?q=)
 * - pretraga po first_name, last_name, email, phone, company
 * - sort by created_at DESC
 */
app.get('/api/contacts', async (req, res) => {
  const { q } = req.query;
  let sql =
    'SELECT id, first_name, last_name, email, phone, company, avatar_url, notes, created_at, updated_at FROM contacts';
  const params = [];

  if (q && String(q).trim()) {
    sql +=
      ' WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ?)';
    const like = `%${String(q).trim()}%`;
    params.push(like, like, like, like, like);
  }

  sql += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(sql, params);
  res.json(rows.map(mapRow));
});

/** Get by id */
app.get('/api/contacts/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, first_name, last_name, email, phone, company, avatar_url, notes, created_at, updated_at FROM contacts WHERE id = ?',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(mapRow(rows[0]));
});

/** Create */
app.post('/api/contacts', async (req, res) => {
  const { firstName, lastName, email, phone, company, avatarUrl, notes } =
    req.body || {};

  if (!firstName?.trim() || !email?.trim()) {
    return res
      .status(400)
      .json({ error: 'firstName and email are required' });
  }

  const id = nanoid(8);
  try {
    await pool.query(
      `INSERT INTO contacts
       (id, first_name, last_name, email, phone, company, avatar_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        firstName.trim(),
        lastName?.trim() || null,
        email.trim(),
        phone?.trim() || null,
        company?.trim() || null,
        avatarUrl?.trim() || null,
        notes ?? null,
      ]
    );
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw e;
  }

  const [rows] = await pool.query(
    'SELECT id, first_name, last_name, email, phone, company, avatar_url, notes, created_at, updated_at FROM contacts WHERE id = ?',
    [id]
  );
  res.status(201).json(mapRow(rows[0]));
});

/** Update (partial) */
app.put('/api/contacts/:id', async (req, res) => {
  const { firstName, lastName, email, phone, company, avatarUrl, notes } =
    req.body || {};

  try {
    const [result] = await pool.query(
      `
      UPDATE contacts
      SET
        first_name = COALESCE(?, first_name),
        last_name  = COALESCE(?, last_name),
        email      = COALESCE(?, email),
        phone      = COALESCE(?, phone),
        company    = COALESCE(?, company),
        avatar_url = COALESCE(?, avatar_url),
        notes      = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        firstName ?? null,
        lastName ?? null,
        email ?? null,
        phone ?? null,
        company ?? null,
        avatarUrl ?? null,
        notes ?? null,
        req.params.id,
      ]
    );

    if (!result.affectedRows)
      return res.status(404).json({ error: 'Not found' });
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    throw e;
  }

  const [rows] = await pool.query(
    'SELECT id, first_name, last_name, email, phone, company, avatar_url, notes, created_at, updated_at FROM contacts WHERE id = ?',
    [req.params.id]
  );
  res.json(mapRow(rows[0]));
});

/** Delete */
app.delete('/api/contacts/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM contacts WHERE id = ?', [
    req.params.id,
  ]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

app.listen(PORT, () => console.log(`Contacts API listening on ${PORT}`));
