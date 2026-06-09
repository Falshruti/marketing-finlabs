require('dotenv').config();
const axios = require('axios');
const { getAuthHeaders } = require('./zoho-auth');

const ZOHO_DOMAIN = process.env.ZOHO_DOMAIN || 'zoho.in';
const domainSuffix = ZOHO_DOMAIN.replace('zoho.', '');
const ZOHO_BASE_URL = `https://www.zohoapis.${domainSuffix}/crm/v2.1`;

async function fetchAll(module, fields) {
  const headers = await getAuthHeaders();
  let page = 1;
  let allData = [];
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`${ZOHO_BASE_URL}/${module}`, {
      headers,
      params: {
        page,
        per_page: 200,
        fields
      }
    });

    const data = response.data?.data || [];
    allData = allData.concat(data);

    const info = response.data?.info;
    hasMore = info?.more_records === true;
    page++;
    if (allData.length >= 5000) break;
  }
  return allData;
}

async function test() {
  try {
    console.log("Fetching data...");
    const [leads, accounts, contacts] = await Promise.all([
      fetchAll('Leads', 'Created_Time,Tag,Lead_Status'),
      fetchAll('Accounts', 'Created_Time,Tag'),
      fetchAll('Contacts', 'Created_Time,Tag')
    ]);

    console.log(`\nDATABASE TOTALS:`);
    console.log(`Leads: ${leads.length}`);
    console.log(`Accounts (Subscribed): ${accounts.length}`);
    console.log(`Contacts (Trial): ${contacts.length}`);

    // Helper to count by June 2026 date range
    const filterByDateRange = (items) => {
      const start = new Date('2026-06-01T00:00:00+05:30');
      const end = new Date('2026-06-30T23:59:59.999+05:30');
      return items.filter(item => {
        const d = item.Created_Time ? new Date(item.Created_Time) : null;
        return d && d >= start && d <= end;
      });
    };

    // Helper to count by tag month/year
    const filterByTag = (items, month, year) => {
      return items.filter(item => {
        const tags = item.Tag || [];
        return tags.some(t => {
          const name = ((typeof t === 'string' ? t : t.name) || '').toLowerCase();
          return name.includes(month.toLowerCase()) && name.includes(String(year));
        });
      });
    };

    console.log(`\nJUNE 2026 BY CREATED_TIME (Date Range):`);
    console.log(`Leads: ${filterByDateRange(leads).length}`);
    console.log(`Accounts (Subscribed): ${filterByDateRange(accounts).length}`);
    console.log(`Contacts (Trial): ${filterByDateRange(contacts).length}`);

    console.log(`\nJUNE 2026 BY "June 2026" TAG:`);
    console.log(`Leads: ${filterByTag(leads, 'June', 2026).length}`);
    console.log(`Accounts (Subscribed): ${filterByTag(accounts, 'June', 2026).length}`);
    console.log(`Contacts (Trial): ${filterByTag(contacts, 'June', 2026).length}`);

    // Sample tags on contacts
    console.log(`\nSample Tags on Contacts:`);
    contacts.slice(0, 10).forEach((c, idx) => {
      console.log(`Contact ${idx}: Created_Time=${c.Created_Time}, Tags=${JSON.stringify(c.Tag)}`);
    });

    // Sample tags on leads
    console.log(`\nSample Tags on Leads:`);
    leads.slice(0, 10).forEach((l, idx) => {
      console.log(`Lead ${idx}: Created_Time=${l.Created_Time}, Tags=${JSON.stringify(l.Tag)}, Status=${l.Lead_Status}`);
    });

  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
