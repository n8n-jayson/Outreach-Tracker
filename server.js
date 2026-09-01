const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_ID = process.env.AIRTABLE_TABLE_ID;

if (!AIRTABLE_PAT || !BASE_ID || !TABLE_ID) {
  console.warn('WARNING: Missing one of AIRTABLE_PAT / AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID env vars. API calls will fail until these are set.');
}

const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

function airtableHeaders() {
  return {
    'Authorization': `Bearer ${AIRTABLE_PAT}`,
    'Content-Type': 'application/json'
  };
}

function mapRecord(r) {
  return {
    id: r.id,
    name: r.fields['Name'] || '',
    phone: r.fields['Phone'] || '',
    email: r.fields['Email'] || '',
    website: r.fields['Website'] || '',
    linkedin: r.fields['LinkedIn Link'] || '',
    fb: r.fields['FB Link'] || '',
    ig: r.fields['IG Link'] || '',
    platform: r.fields['Platform'] || 'LinkedIn',
    status: r.fields['Status'] || 'Not Contacted',
    dateSent: r.fields['Date Sent'] || null,
    notes: r.fields['Notes'] || ''
  };
}

// GET all leads
app.get('/api/leads', async (req, res) => {
  try {
    let records = [];
    let offset;
    do {
      const url = new URL(AIRTABLE_URL);
      url.searchParams.set('pageSize', '100');
      if (offset) url.searchParams.set('offset', offset);
      const r = await fetch(url, { headers: airtableHeaders() });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      records = records.concat(data.records);
      offset = data.offset;
    } while (offset);
    res.json(records.map(mapRecord));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREATE lead
app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, email, website, linkedin, fb, ig, platform, notes } = req.body;
    const r = await fetch(AIRTABLE_URL, {
      method: 'POST',
      headers: airtableHeaders(),
      body: JSON.stringify({
        records: [{
          fields: {
            'Name': name,
            'Phone': phone || '',
            'Email': email || '',
            'Website': website || '',
            'LinkedIn Link': linkedin || '',
            'FB Link': fb || '',
            'IG Link': ig || '',
            'Platform': platform || 'LinkedIn',
            'Status': 'Not Contacted',
            'Notes': notes || ''
          }
        }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(mapRecord(data.records[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE lead (status, dateSent, notes, name, phone, email, linkedin, fb, ig, platform)
app.patch('/api/leads/:id', async (req, res) => {
  try {
    const fields = {};
    if (req.body.status !== undefined) fields['Status'] = req.body.status;
    if (req.body.dateSent !== undefined) fields['Date Sent'] = req.body.dateSent;
    if (req.body.notes !== undefined) fields['Notes'] = req.body.notes;
    if (req.body.name !== undefined) fields['Name'] = req.body.name;
    if (req.body.phone !== undefined) fields['Phone'] = req.body.phone;
    if (req.body.email !== undefined) fields['Email'] = req.body.email;
    if (req.body.website !== undefined) fields['Website'] = req.body.website;
    if (req.body.linkedin !== undefined) fields['LinkedIn Link'] = req.body.linkedin;
    if (req.body.fb !== undefined) fields['FB Link'] = req.body.fb;
    if (req.body.ig !== undefined) fields['IG Link'] = req.body.ig;
    if (req.body.platform !== undefined) fields['Platform'] = req.body.platform;

    const r = await fetch(AIRTABLE_URL, {
      method: 'PATCH',
      headers: airtableHeaders(),
      body: JSON.stringify({ records: [{ id: req.params.id, fields }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(mapRecord(data.records[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const url = new URL(AIRTABLE_URL);
    url.searchParams.append('records[]', req.params.id);
    const r = await fetch(url, { method: 'DELETE', headers: airtableHeaders() });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Basic health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Outreach tracker running on port ${PORT}`));
