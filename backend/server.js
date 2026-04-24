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
function getUserHHMM(offsetMins) {
  const localMs = Date.now() - (offsetMins * 60000);
  const localDate = new Date(localMs);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}`;
}

// Check every 30 seconds for due medicines
setInterval(() => {
  let needsSave = false;
  const localHHMMMap = new Map();

  users.forEach((user, endpoint) => {
    if (!localHHMMMap.has(user.offsetMins)) {
      localHHMMMap.set(user.offsetMins, getUserHHMM(user.offsetMins));
    }
    const localHHMM = localHHMMMap.get(user.offsetMins);
    
    let userNeedsSave = false;

    user.medicines.forEach(m => {
      // If it's time, and they haven't taken it yet
      if (!m.taken && m.time === localHHMM) {
        
        // Prevent spamming the same notification in the same minute
        if (m.lastPushedTime === localHHMM) return;
        m.lastPushedTime = localHHMM; 
        userNeedsSave = true;

        const payload = JSON.stringify({
          title: '💊 Medicine Reminder',
          body: `Time to take ${m.name} — ${m.dosage}${m.notes ? '. ' + m.notes : ''}`,
          tag: `med-${m.id}`,
          icon: '/icon-512.png',
          data: {
            url: '/' // When clicked, opens the app
          }
        });

        webpush.sendNotification(user.subscription, payload).catch(err => {
          console.error('Push error:', err);
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Subscription expired or removed:', endpoint);
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
  loadState();
});
