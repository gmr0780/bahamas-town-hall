import { Router, Request, Response } from 'express';
import pool from '../services/database';
import { adminAuth } from '../middleware/admin-auth';

const router = Router();

const VALID_TYPES = ['text', 'textarea', 'dropdown', 'checkbox', 'scale'];

router.get('/api/admin/questions', adminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM questions ORDER BY sort_order ASC, id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin questions fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/api/admin/questions', adminAuth, async (req: Request, res: Response) => {
  const { type, label, description, required, options } = req.body;

  const errors: string[] = [];
  if (!label?.trim()) errors.push('Label is required');
  if (!VALID_TYPES.includes(type)) errors.push(`Type must be one of: ${VALID_TYPES.join(', ')}`);
  if ((type === 'dropdown' || type === 'checkbox') && (!Array.isArray(options) || options.length === 0)) {
    errors.push('Options are required for dropdown and checkbox types');
  }
  if (type === 'scale' && (!options || typeof options.min !== 'number' || typeof options.max !== 'number')) {
    errors.push('Scale type requires options with min and max');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const maxOrder = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM questions');
    const sort_order = maxOrder.rows[0].next;

    const result = await pool.query(
      `INSERT INTO questions (type, label, description, required, sort_order, options)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [type, label, description || null, required || false, sort_order, options ? JSON.stringify(options) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Question create error:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/api/admin/questions/:id', adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, label, description, required, options, active } = req.body;

  const errors: string[] = [];
  if (label !== undefined && !label?.trim()) errors.push('Label cannot be empty');
  if (type !== undefined && !VALID_TYPES.includes(type)) errors.push(`Type must be one of: ${VALID_TYPES.join(', ')}`);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (type !== undefined) { fields.push(`type = $${idx++}`); values.push(type); }
    if (label !== undefined) { fields.push(`label = $${idx++}`); values.push(label); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (required !== undefined) { fields.push(`required = $${idx++}`); values.push(required); }
    if (options !== undefined) { fields.push(`options = $${idx++}`); values.push(JSON.stringify(options)); }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE questions SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Question update error:', err);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.patch('/api/admin/questions/reorder', adminAuth, async (req: Request, res: Response) => {
  const { order } = req.body;

  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of { id, sort_order }' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of order) {
      await client.query('UPDATE questions SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Question reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder questions' });
  } finally {
    client.release();
  }
});

router.delete('/api/admin/questions/:id', adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE questions SET active = false WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Question delete error:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;
