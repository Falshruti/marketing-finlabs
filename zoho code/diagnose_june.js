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
      params: { page, per_page: 200, fields }
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

async function diagnose() {
  try {
    console.log('Fetching leads...');
    const leads = await fetchAll('Leads', 'First_Name,Last_Name,Created_Time,Tag,Lead_Status,Converted');

    const juneStart = new Date('2026-06-01T00:00:00+05:30');
    const juneEnd   = new Date('2026-06-30T23:59:59.999+05:30');

    const hasJuneTag = (lead) => {
      const tags = lead.Tag || [];
      return tags.some(t => {
        const name = ((typeof t === 'string' ? t : t.name) || '').toLowerCase();
        return name.includes('june') && name.includes('2026');
      });
    };

    const hasJuneDateRange = (lead) => {
      if (!lead.Created_Time) return false;
      const d = new Date(lead.Created_Time);
      return d >= juneStart && d <= juneEnd;
    };

    const byDate = leads.filter(hasJuneDateRange);
    const byTag  = leads.filter(hasJuneTag);

    // Leads in date range but WITHOUT June 2026 tag
    const dateOnlyNotTag = byDate.filter(l => !hasJuneTag(l));

    // Leads with June 2026 tag but OUTSIDE date range
    const tagOnlyNotDate = byTag.filter(l => !hasJuneDateRange(l));

    // Leads with BOTH
    const both = byDate.filter(l => hasJuneTag(l));

    console.log(`\n===== JUNE 2026 LEAD COUNT BREAKDOWN =====`);
    console.log(`Total leads in DB                          : ${leads.length}`);
    console.log(`\nBy Created_Time (Jun 1–30)                 : ${byDate.length}`);
    console.log(`By "June 2026" Tag                         : ${byTag.length}`);
    console.log(`Both tag AND date match                     : ${both.length}`);
    console.log(`In date range but NO June 2026 tag         : ${dateOnlyNotTag.length}`);
    console.log(`Have June 2026 tag but OUTSIDE date range  : ${tagOnlyNotDate.length}`);

    if (dateOnlyNotTag.length > 0) {
      console.log(`\n--- Leads in Jun date range but WITHOUT "June 2026" tag ---`);
      dateOnlyNotTag.forEach((l, i) => {
        const name = `${l.First_Name || ''} ${l.Last_Name || ''}`.trim();
        const tags = (l.Tag || []).map(t => (typeof t === 'string' ? t : t.name)).join(', ');
        console.log(`  ${i+1}. ${name} | Created: ${l.Created_Time} | Status: ${l.Lead_Status} | Tags: [${tags || 'NONE'}]`);
      });
    }

    if (tagOnlyNotDate.length > 0) {
      console.log(`\n--- Leads with "June 2026" tag but OUTSIDE Jun date range ---`);
      tagOnlyNotDate.forEach((l, i) => {
        const name = `${l.First_Name || ''} ${l.Last_Name || ''}`.trim();
        const tags = (l.Tag || []).map(t => (typeof t === 'string' ? t : t.name)).join(', ');
        console.log(`  ${i+1}. ${name} | Created: ${l.Created_Time} | Status: ${l.Lead_Status} | Tags: [${tags}]`);
      });
    }

    // Breakdown by status for date-range leads
    const statusCounts = {};
    byDate.forEach(l => {
      const s = l.Lead_Status || 'Unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    console.log(`\n--- Status breakdown of ${byDate.length} date-range leads ---`);
    Object.entries(statusCounts).sort((a,b)=>b[1]-a[1]).forEach(([s,c]) => {
      console.log(`  ${s}: ${c}`);
    });

    // Breakdown by status for tag leads
    const tagStatusCounts = {};
    byTag.forEach(l => {
      const s = l.Lead_Status || 'Unknown';
      tagStatusCounts[s] = (tagStatusCounts[s] || 0) + 1;
    });
    console.log(`\n--- Status breakdown of ${byTag.length} tag-based leads ---`);
    Object.entries(tagStatusCounts).sort((a,b)=>b[1]-a[1]).forEach(([s,c]) => {
      console.log(`  ${s}: ${c}`);
    });

    // What date range do tagOnlyNotDate leads have?
    if (tagOnlyNotDate.length > 0) {
      console.log(`\n→ These ${tagOnlyNotDate.length} "June 2026" tagged leads were created BEFORE June. They will be included when filtering by tag but excluded by date range.`);
    }

    console.log(`\n===== RECOMMENDATION =====`);
    console.log(`Zoho UI count 56 likely means the correct June count excludes some records.`);
    console.log(`Check if any of the 59 date-range leads are "Junk", Deleted, or converted.`);
    const converted = byDate.filter(l => l.Converted);
    const junk = byDate.filter(l => (l.Lead_Status || '').toLowerCase().includes('junk'));
    console.log(`  → Converted leads in date range: ${converted.length}`);
    console.log(`  → Junk/invalid leads in date range: ${junk.length}`);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

diagnose();
