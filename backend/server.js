const express = require('express');
const cors = require('cors');
const webpush = require('web-push');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your generated VAPID keys
const publicVapidKey = 'BPktub46zVbCBkIgyLzolPnu-WmTdQnvT1Ovn6N0hPhY6Y6HM8SIHK4vhxxk2Rwlm3LSkU6yAQAZPNMg9cfRjB4';
const privateVapidKey = 'a3EeIAuHwxsEXkq8VUCu3fd2IdFc4z9_dtOL43ujQL0';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  publicVapidKey,
  privateVapidKey
);

// Store users in memory but sync with JSONBlob for persistence
const users = new Map();
const JSONBLOB_URL = 'https://jsonblob.com/api/jsonBlob/019dbec9-51b2-759a-ad72-efa9b583a2fa';

// Load initial state from JSONBlob
async function loadState() {
  try {
    const res = await fetch(JSONBLOB_URL);
    if (res.ok) {
      const data = await res.json();
      if (data && data.users) {
        Object.keys(data.users).forEach(endpoint => {
          users.set(endpoint, data.users[endpoint]);
        });
        console.log(`Loaded ${users.size} users from persistent storage.`);
      }
    }
  } catch (err) {
    console.error('Failed to load state from JSONBlob:', err);
  }
}

// Save state to JSONBlob
async function saveState() {
  try {
    const usersObj = {};
    users.forEach((val, key) => {
      usersObj[key] = val;
    });
    await fetch(JSONBLOB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: usersObj })
    });
  } catch (err) {
    console.error('Failed to save state to JSONBlob:', err);
  }
}

// Ping endpoint to keep the server awake
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.post('/sync', (req, res) => {
  const { subscription, medicines, offsetMins } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  // Update or insert user
  users.set(subscription.endpoint, {
    subscription,
    medicines: medicines || [],
    offsetMins: offsetMins || 0
  });

  // Persist to JSONBlob
  saveState();

  res.status(200).json({ success: true, message: 'Synced successfully' });
});

// Helper to get the user's local HH:MM time
// getTimezoneOffset() returns (UTC - local) in minutes
// e.g. IST (UTC+5:30) => -330, so localTime = UTC + 330 min
function getUserHHMM(offsetMins) {
  // offsetMins is from getTimezoneOffset(): negative means ahead of UTC
  // To get local time: UTC - offsetMins
  const localMs = Date.now() - (offsetMins * 60000);
  const localDate = new Date(localMs);
  const pad = (n) => String(n).padStart(2, '0');
  const hhmm = `${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}`;
  return hhmm;
}

// Helper to get today's date string YYYY-MM-DD in user's local timezone
function getUserDateString(offsetMins) {
  const localMs = Date.now() - (offsetMins * 60000);
  const localDate = new Date(localMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth()+1)}-${pad(localDate.getUTCDate())}`;
}

// Debug endpoint - see what the server knows
app.get('/debug', (req, res) => {
  const debugInfo = [];
  users.forEach((user, endpoint) => {
    if (!user) return;
    const offset = user.offsetMins || 0;
    const localHHMM = getUserHHMM(offset);
    const todayDate = getUserDateString(offset);
    const meds = user.medicines || [];
    debugInfo.push({
      endpoint: endpoint.slice(-20),
      offsetMins: offset,
      serverUTC: new Date().toISOString(),
      userLocalTime: localHHMM,
      userLocalDate: todayDate,
      medicines: meds.map(m => ({
        name: m.name,
        time: m.time,
        taken: m.taken,
        lastPushedTime: m.lastPushedTime || null,
        lastPushedDate: m.lastPushedDate || null,
        willFire: !m.taken && m.time === localHHMM
      }))
    });
  });
  res.json({ users: debugInfo, totalUsers: users.size });
});

// Check every 30 seconds for due medicines
setInterval(() => {
  let needsSave = false;

  users.forEach((user, endpoint) => {
    if (!user) return;
    const offset = user.offsetMins || 0;
    const localHHMM = getUserHHMM(offset);
    const todayDate = getUserDateString(offset);
    let userNeedsSave = false;

    const meds = user.medicines || [];
    meds.forEach(m => {
      // Reset lastPushedTime if it's a new day (so daily reminders fire again)
      if (m.lastPushedDate && m.lastPushedDate !== todayDate) {
        m.lastPushedTime = null;
        m.lastPushedDate = null;
        m.taken = false; // Reset taken status for new day
        userNeedsSave = true;
        console.log(`[Reset] New day for ${m.name} — clearing taken/pushed state`);
      }

      // If it's time, and they haven't taken it yet
      if (!m.taken && m.time === localHHMM) {

        // Prevent spamming the same notification in the same minute
        if (m.lastPushedTime === localHHMM) return;

        m.lastPushedTime = localHHMM;
        m.lastPushedDate = todayDate;
        userNeedsSave = true;

        const payload = JSON.stringify({
          title: '💊 Medicine Reminder',
          body: `Time to take ${m.name} — ${m.dosage}${m.notes ? '. ' + m.notes : ''}`,
          tag: `med-${m.id}`,
          icon: '/icon-512.png',
          data: { url: '/' }
        });

        console.log(`[Push] Sending to ${endpoint.slice(-10)} for ${m.name} at ${localHHMM}`);

        webpush.sendNotification(user.subscription, payload).then(() => {
          console.log(`[Push] ✅ Sent: ${m.name} to ${endpoint.slice(-10)}`);
        }).catch(err => {
          console.error(`[Push] ❌ Error for ${m.name}:`, err.statusCode, err.body);
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('[Push] Subscription gone, removing user:', endpoint.slice(-10));
            users.delete(endpoint);
            needsSave = true;
          }
        });
      }
    });

    if (userNeedsSave) {
      needsSave = true;
    }
  });

  if (needsSave) {
    saveState();
  }
}, 30000);

const PORT = process.env.PORT || 3000;
const SERVER_URL = process.env.RENDER_EXTERNAL_URL || 'https://med-reminder-joqh.onrender.com';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Server URL: ${SERVER_URL}`);
  loadState();

  // ── Self-ping keepalive ──────────────────────────────────────────────────
  // Render free tier sleeps after ~15 min of inactivity.
  // Pinging ourselves every 10 min keeps the process alive so setInterval
  // keeps firing medicine reminders even with no user traffic.
  setInterval(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/ping`);
      console.log(`[Keepalive] Self-ping OK — ${new Date().toISOString()}`);
    } catch (err) {
      console.warn(`[Keepalive] Self-ping failed:`, err.message);
    }
  }, 10 * 60 * 1000); // every 10 minutes
});
