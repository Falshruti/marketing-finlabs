require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { getAuthHeaders } = require('./zoho-auth');

const app = express();
const PORT = process.env.PORT || 3000;
const ZOHO_DOMAIN = process.env.ZOHO_DOMAIN || 'zoho.in';
const domainSuffix = ZOHO_DOMAIN.replace('zoho.', '');
const ZOHO_BASE_URL = `https://www.zohoapis.${domainSuffix}/crm/v2.1`;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Fetch all leads from Zoho CRM (handles pagination)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAllLeads() {
  const headers = await getAuthHeaders();
  let page = 1;
  let allLeads = [];
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`${ZOHO_BASE_URL}/Leads`, {
      headers,
      params: {
        page,
        per_page: 200,
        fields: [
          'First_Name', 'Last_Name', 'Email', 'Phone', 'Mobile',
          'Company', 'Lead_Source', 'Lead_Status', 'Rating',
          'Annual_Revenue', 'Industry', 'No_of_Employees',
          'City', 'State', 'Country', 'Created_Time', 'Modified_Time',
          'Converted', 'Lead_Score', 'Owner', 'Description',
          'Website', 'Designation', 'Fax', 'Secondary_Email', 'Tag',
          'Date_of_Demo_Schedule', 'Date_of_Demo_Conducted'
        ].join(',')
      }
    });

    const data = response.data?.data || [];
    allLeads = allLeads.concat(data);

    const info = response.data?.info;
    hasMore = info?.more_records === true;
    page++;

    // Safety: stop at 5000 leads
    if (allLeads.length >= 5000) break;
  }

  return allLeads;
}

// ─────────────────────────────────────────────────────────────────────────────
// API: Get all leads
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await fetchAllLeads();
    res.json({ success: true, total: leads.length, data: leads });
  } catch (err) {
    console.error('[API /leads]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// API: Get dashboard stats (aggregated)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const leads = await fetchAllLeads();

    // Status breakdown
    const statusCount = {};
    const sourceCount = {};
    const ratingCount = {};
    const monthlyCount = {};
    const industryCount = {};
    const stateCount = {};
    let converted = 0;
    let thisMonth = 0;
    let lastMonth = 0;

    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    leads.forEach(lead => {
      // Status
      const status = lead.Lead_Status || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;

      // Source
      const source = lead.Lead_Source || 'Unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;

      // Rating
      const rating = lead.Rating || 'Unknown';
      ratingCount[rating] = (ratingCount[rating] || 0) + 1;

      // Industry
      const industry = lead.Industry || 'Unknown';
      industryCount[industry] = (industryCount[industry] || 0) + 1;

      // State
      const state = lead.State || 'Unknown';
      stateCount[state] = (stateCount[state] || 0) + 1;

      // Converted
      if (lead.Converted) converted++;

      // Monthly trend (last 12 months)
      if (lead.Created_Time) {
        const d = new Date(lead.Created_Time);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyCount[key] = (monthlyCount[key] || 0) + 1;

        if (key === thisMonthKey) thisMonth++;
        if (key === lastMonthKey) lastMonth++;
      }
    });

    // Build last 12 months trend
    const trend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      trend.push({ key, label, count: monthlyCount[key] || 0 });
    }

    // Top 10 for each category
    const topN = (obj, n = 10) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([label, count]) => ({ label, count }));

    const stats = {
      total: leads.length,
      converted,
      unconverted: leads.length - converted,
      thisMonth,
      lastMonth,
      growthRate:
        lastMonth > 0
          ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1)
          : null,
      statusBreakdown: topN(statusCount, 10),
      sourceBreakdown: topN(sourceCount, 10),
      ratingBreakdown: topN(ratingCount, 6),
      industryBreakdown: topN(industryCount, 10),
      stateBreakdown: topN(stateCount, 10),
      monthlyTrend: trend
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[API /stats]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// API: Search leads
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/leads/search', async (req, res) => {
  try {
    const { q, status, source, page = 1, limit = 20 } = req.query;
    const leads = await fetchAllLeads();

    let filtered = leads;

    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(lead => {
        const name = `${lead.First_Name || ''} ${lead.Last_Name || ''}`.toLowerCase();
        const email = (lead.Email || '').toLowerCase();
        const company = (lead.Company || '').toLowerCase();
        const phone = (lead.Phone || lead.Mobile || '').toLowerCase();
        return (
          name.includes(query) ||
          email.includes(query) ||
          company.includes(query) ||
          phone.includes(query)
        );
      });
    }

    if (status) {
      filtered = filtered.filter(
        lead => lead.Lead_Status?.toLowerCase() === status.toLowerCase()
      );
    }

    if (source) {
      filtered = filtered.filter(
        lead => lead.Lead_Source?.toLowerCase() === source.toLowerCase()
      );
    }

    const total = filtered.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      data: paginated
    });
  } catch (err) {
    console.error('[API /leads/search]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Helper: Fetch all Accounts (handles pagination)
async function fetchAllAccounts() {
  const headers = await getAuthHeaders();
  let page = 1;
  let allAccounts = [];
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`${ZOHO_BASE_URL}/Accounts`, {
      headers,
      params: {
        page,
        per_page: 200,
        fields: 'Account_Name,Created_Time,Tag'
      }
    });

    const data = response.data?.data || [];
    allAccounts = allAccounts.concat(data);

    const info = response.data?.info;
    hasMore = info?.more_records === true;
    page++;

    if (allAccounts.length >= 5000) break;
  }

  return allAccounts;
}

// Helper: Fetch all Contacts (handles pagination)
async function fetchAllContacts() {
  const headers = await getAuthHeaders();
  let page = 1;
  let allContacts = [];
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`${ZOHO_BASE_URL}/Contacts`, {
      headers,
      params: {
        page,
        per_page: 200,
        fields: 'First_Name,Last_Name,Created_Time,Tag'
      }
    });

    const data = response.data?.data || [];
    allContacts = allContacts.concat(data);

    const info = response.data?.info;
    hasMore = info?.more_records === true;
    page++;

    if (allContacts.length >= 5000) break;
  }

  return allContacts;
}

// API: Get all Accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await fetchAllAccounts();
    res.json({ success: true, total: accounts.length, data: accounts });
  } catch (err) {
    console.error('[API /accounts]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get all Contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await fetchAllContacts();
    res.json({ success: true, total: contacts.length, data: contacts });
  } catch (err) {
    console.error('[API /contacts]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// Fallback: serve index.html
// ─────────────────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Zoho CRM Lead Dashboard running at:`);
  console.log(`   \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   GET /api/stats     → Dashboard statistics`);
  console.log(`   GET /api/leads     → All leads`);
  console.log(`   GET /api/leads/search?q=&status=&source=&page=&limit=`);
  console.log(`\n✅ Ready!\n`);
});
