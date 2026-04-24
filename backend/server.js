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

// Store users in memory. In a real app, use a database.
// Map of endpoint -> { subscription, medicines, offsetMins }
const users = new Map();

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
  users.forEach((user, endpoint) => {
    const localHHMM = getUserHHMM(user.offsetMins);
    
    user.medicines.forEach(m => {
      // If it's time, and they haven't taken it yet
      if (!m.taken && m.time === localHHMM) {
        
        // Prevent spamming the same notification in the same minute
        if (m.lastPushedTime === localHHMM) return;
        m.lastPushedTime = localHHMM; 

        const payload = JSON.stringify({
          title: '💊 Medicine Reminder',
          body: `Time to take ${m.name} — ${m.dosage}${m.notes ? '. ' + m.notes : ''}`,
          tag: `med-${m.id}`,
          icon: 'icon-512.png',
          data: {
            url: '/' // When clicked, opens the app
          }
        });

        webpush.sendNotification(user.subscription, payload).catch(err => {
          console.error('Push error:', err);
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Subscription expired or removed:', endpoint);
            users.delete(endpoint);
          }
        });
      }
    });
  });
}, 30000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
