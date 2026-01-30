const express = require('express');
const router = express.Router();
const Message = require('./models/Message');

// POST /login - verifies email and password from env
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const envEmail = process.env.EMAIL;
  const envPassword = process.env.PASSWORD;
  if (email === envEmail && password === envPassword) return res.status(200).json({ ok: true });
  return res.status(401).json({ ok: false, error: 'invalid_credentials' });
});

// POST /upload-messages - accepts array of messages and stores them
router.post('/upload-messages', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages must be array' });

    const docs = messages.map((m) => ({
      phone: m.phone,
      name: m.name || null,
      body: m.body,
      direction: m.direction,
      timestamp: new Date(m.timestamp),
    }));

    await Message.insertMany(docs, { ordered: false });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// GET /threads - return unique phone numbers with latest timestamp
router.get('/threads', async (req, res) => {
  try {
    const results = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$phone', name: { $first: '$name' }, last: { $first: '$timestamp' }, lastBody: { $first: '$body' } } },
      { $project: { phone: '$_id', name: 1, last: 1, lastBody: 1, _id: 0 } },
      { $sort: { last: -1 } }
    ]);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /messages/:phone - return messages for phone sorted oldest->newest
router.get('/messages/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const messages = await Message.find({ phone }).sort({ timestamp: 1 }).lean();
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /all-messages - get all messages for dashboard
router.get('/all-messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).lean();
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// PUT /edit-message/:id - edit a message
router.put('/edit-message/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const msg = await Message.findByIdAndUpdate(id, updates, { new: true });
    if (!msg) return res.status(404).json({ error: 'message_not_found' });
    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// DELETE /delete-message/:id - delete a message
router.delete('/delete-message/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findByIdAndDelete(id);
    if (!msg) return res.status(404).json({ error: 'message_not_found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /requests - placeholder, since logging is in console
router.get('/requests', (req, res) => {
  res.json({ message: 'Requests are logged in server console' });
});

module.exports = router;
