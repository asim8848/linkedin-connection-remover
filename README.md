# LinkedIn Connection Remover 🔄

A browser extension that automates the process of removing connections from LinkedIn. Clean up your professional network efficiently.

![GitHub](https://img.shields.io/github/license/asim8848/linkedin-connection-remover)
![Chrome Web Store](https://img.shields.io/badge/platform-Chrome-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

## 📋 Table of Contents
- [How It Works](#-how-it-works)
- [Installation](#-installation)
- [Usage Instructions](#-usage-instructions)
- [Console Method](#-console-method)
- [Privacy & Security](#-privacy--security)
- [Contributing](#-contributing)
- [License](#-license)

## 🔍 How It Works

This extension injects a content script into LinkedIn pages that:
1. 🧭 Navigates to your connections page
2. 🔎 Identifies connection elements in the page
3. 🖱️ Simulates clicks on the required buttons to remove connections
4. ✅ Handles confirmation dialogs
5. 📄 Continues through pagination to process all connections

The extension respects LinkedIn's UI patterns and adds random delays between actions to avoid triggering rate limits.

## 💻 Installation

### Clone the Repository
```bash
git clone https://github.com/asim8848/linkedin-connection-remover.git
cd linkedin-connection-remover
```

### Load the Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click "Load unpacked"
4. Select the cloned repository folder
5. The extension icon should appear in your browser toolbar

## 🚀 Usage Instructions

1. Log in to your LinkedIn account
2. Navigate to your connections page: https://www.linkedin.com/mynetwork/invite-connect/connections/
3. Click the extension icon in your browser toolbar
4. Configure settings in the popup (if applicable):
   - Number of connections to remove
   - Removal speed
   - Any filtering options
5. Click "Start Removing"
6. The extension will begin automatically removing connections
7. You can stop the process anytime by clicking "Stop" or closing the tab

## 🖥️ Console Method

For advanced users, you can also trigger functionality via the browser console:

```javascript
// Open your connections page on LinkedIn
// Open developer console (F12 or right-click > Inspect > Console)
// Paste and run the following command:

// To start removing connections with the default settings
document.dispatchEvent(new CustomEvent('startRemovingConnections'));

// With custom settings
document.dispatchEvent(new CustomEvent('startRemovingConnections', { 
  detail: { 
    limit: 50,  // Maximum connections to remove
    delay: 2000 // Milliseconds between actions
  } 
}));
```

## 📱 Demo

![Demo GIF](demo.gif)

## 🔒 Privacy & Security

This extension:
- 🔐 Runs entirely in your browser
- 🚫 Does not collect or transmit your data
- 🙅‍♂️ Does not store your LinkedIn credentials
- ✅ Only requires permissions necessary for functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⭐ Star History

If this project helps you, please consider giving it a star! Your support helps keep the project active.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by [Asim](https://github.com/asim8848)
