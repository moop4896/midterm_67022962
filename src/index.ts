import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const app = new Hono()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(
  path.resolve(__dirname, 'app.db')
)

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT
  )
`)

// --------------------
// CREATE
// --------------------
app.post('/customers', async (c) => {
  const { name, email, phone, address } = await c.req.json()

  const stmt = db.prepare(`
    INSERT INTO customers (name, email, phone, address)
    VALUES (?, ?, ?, ?)
  `)

  const result = stmt.run(name, email, phone, address)

  return c.json({
    message: 'Customer created',
    customer_id: result.lastInsertRowid,
  })
})

// --------------------
// READ ALL
// --------------------
app.get('/customers', (c) => {
  const rows = db.prepare('SELECT * FROM customers').all()
  return c.json(rows)
})

// --------------------
// READ BY ID
// --------------------
app.get('/customers/:id', (c) => {
  const id = c.req.param('id')

  const row = db
    .prepare('SELECT * FROM customers WHERE customer_id = ?')
    .get(id)

  if (!row) {
    return c.json({ message: 'Customer not found' }, 404)
  }

  return c.json(row)
})

// --------------------
// UPDATE
// --------------------
app.put('/customers/:id', async (c) => {
  const id = c.req.param('id')
  const { name, email, phone, address } = await c.req.json()

  const result = db.prepare(`
    UPDATE customers
    SET name=?, email=?, phone=?, address=?
    WHERE customer_id=?
  `).run(name, email, phone, address, id)

  if (result.changes === 0) {
    return c.json({ message: 'Customer not found' }, 404)
  }

  return c.json({ message: 'Customer updated' })
})

// --------------------
// DELETE
// --------------------
app.delete('/customers/:id', (c) => {
  const id = c.req.param('id')

  const result = db
    .prepare('DELETE FROM customers WHERE customer_id = ?')
    .run(id)

  if (result.changes === 0) {
    return c.json({ message: 'Customer not found' }, 404)
  }

  return c.json({ message: 'Customer deleted' })
})

// --------------------
serve({
  fetch: app.fetch,
  port: 3000,
})
