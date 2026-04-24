# 💊 MedRemind — Medicine Reminder Web App

> A lightweight, zero-dependency medicine reminder web application with real-time browser notifications. Built with pure HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no install required.

---

## ✨ Features

- 🔔 **Real-time browser push notifications** — alerts fire at the scheduled medicine time using the Web Notifications API
- ⏱️ **Live clock** — updates every second so you always know the current time
- ➕ **Add medicines** — set name, time, type (pill/tablet/liquid), dosage, and optional notes
- ✅ **Mark as taken** — log each dose with one click
- 🗑️ **Delete reminders** — remove medicines you no longer need
- 📋 **Notification log** — timestamped history of every alert, dose taken, and reminder added
- 🎨 **Responsive design** — works on desktop and mobile browsers

---

## 🚀 Getting Started

### Option 1 — Open directly in browser

1. Download or clone this repository:
   ```bash
   git clone https://github.com/abhinhere/Med-Reminder.git
   ```

## 🛠️ How It Works

| Feature | Implementation |
|---|---|
| Scheduling | `setInterval` polls every 30 seconds; fires alert when current time is within ±1 minute of the scheduled time |
| Notifications | Web Notifications API (`Notification` constructor) |
| Fallback alerts | In-app animated toast when browser notifications are denied |
| State | In-memory JavaScript array (resets on page refresh) |
| Styling | Pure CSS with custom properties (CSS variables) |
| Fonts | Google Fonts — DM Sans + Space Mono |

---

## 🔒 Browser Notification Permission

On first load, the app will show a banner asking for notification permission. You must click **Enable** and approve the browser prompt to receive desktop alerts.

| Browser | Support |
|---|---|
| Chrome / Edge | ✅ Full support |
| Firefox | ✅ Full support |
| Safari (macOS 13+) | ✅ Supported |
| Safari iOS | ⚠️ Requires PWA install |

> **Note:** Notifications only work while the browser tab is open. For background notifications (tab closed), a **Service Worker** would need to be added.

---

## 🔮 Roadmap / Planned Features

- [ ] Service Worker for background notifications (tab-independent alerts)
- [ ] LocalStorage persistence (reminders survive page refresh)
- [ ] Recurring schedules (e.g. every 8 hours, daily)
- [ ] Weekly adherence / dose history tracker
- [ ] PWA manifest for mobile home screen install
- [ ] Import / export reminders as JSON
- [ ] Dark mode support

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Your Name**
- GitHub: [abhinhere](https://github.com/abhinhere)
- Email: [abhinchelakkal@gmail.com]

---
