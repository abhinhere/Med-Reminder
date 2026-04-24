# 💊 MedRemind — Medicine Reminder Web App

> An elegant, zero-dependency medicine reminder web application featuring a clean iOS-style aesthetic, real-time push notifications, and full offline persistence.

---

## ✨ Features

- 📱 **Progressive Web App (PWA)** — install directly to your home screen with a custom icon. Includes an automated in-app install prompt banner.
- 🔔 **Mobile & Desktop Push Notifications** — utilizes a Service Worker to deliver robust push notifications across iOS, Android, and Desktop browsers.
- 💾 **Local Storage Persistence** — your reminders, logs, and state are automatically saved to the browser so they survive page refreshes or app restarts.
- 🎨 **Clean iOS Aesthetic** — features a sleek, minimalist light theme with soft shadows and refined typography.
- ⏱️ **Live clock** — updates every second so you always know the current time.
- ➕ **Add medicines** — set name, time, type (pill/tablet/liquid), dosage, and optional notes.
- ✅ **Mark as taken** — log each dose with one click.
- 🗑️ **Delete reminders** — remove medicines you no longer need.
- 📋 **Notification log** — timestamped history of every alert, dose taken, and reminder added.

---

## 🚀 Getting Started

### Hosted / Mobile Usage (Recommended)
You can use the app directly through GitHub Pages on your phone or desktop:
1. Visit the hosted link: [https://abhinhere.github.io/Med-Reminder/](https://abhinhere.github.io/Med-Reminder/)
2. **On Mobile:** Wait for the green "Install MedRemind App" banner to appear and tap **Install**, or use your browser's "Add to Home Screen" option.
3. Once installed, open the app from your home screen and approve Notification permissions when prompted.

### Local Development
1. Clone this repository:
   ```bash
   git clone https://github.com/abhinhere/Med-Reminder.git
   ```
2. Serve locally to ensure the Service Worker and Notification APIs work correctly:
   ```bash
   npx serve .
   # or
   python -m http.server 8080
   ```
3. Open `http://localhost:3000` (or your respective port) in your browser.

---

## 🛠️ How It Works

| Feature | Implementation |
|---|---|
| Persistence | State is synchronized with browser `localStorage` on every change |
| Scheduling | `setInterval` polls time; fires alert when current time matches scheduled time |
| Notifications | Web Notifications API via `ServiceWorkerRegistration.showNotification()` |
| PWA Support | Standard `manifest.json` + `sw.js` (Service Worker) intercepting `beforeinstallprompt` |
| Styling | Pure CSS utilizing modern flexbox/grid and an iOS/Apple design system |
| Fonts | Google Fonts — Inter |

---

## 🔒 Browser Notification Permission

| Browser / OS | Support |
|---|---|
| Chrome / Edge (Desktop & Android) | ✅ Full support via Service Worker |
| Firefox (Desktop) | ✅ Full support |
| Safari (macOS 13+) | ✅ Supported |
| Safari iOS | ✅ Supported **(Requires installing as PWA to home screen)** |

---

## 🔮 Planned Features

- [ ] Recurring schedules (e.g. every 8 hours, daily)
- [ ] Weekly adherence / dose history tracker
- [ ] Import / export reminders as JSON
- [ ] Dark mode toggle support

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

**Abhin**
- GitHub: [abhinhere](https://github.com/abhinhere)
- Email: [abhinchelakkal@gmail.com]
