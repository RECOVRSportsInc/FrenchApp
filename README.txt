French Fast-Track

INSTALLATION
Replace index.html, app.js, sync.js, state.js, quiz.js and words.js in the same GitHub Pages folder. Keep these exact names. Commit and push through VS Code, wait for the GitHub Pages deployment to finish, then reload each device. The new button labels are Sync Now and Export Backup.

SYNC CHECK
1. Use the same existing four-digit code on both devices.
2. Answer a question on one device. Wait until Progress synced appears.
3. Return to the other device. It refreshes when focused or visible, and every 20 seconds while visible. Background mobile tabs cannot poll continuously.
4. Test a page reload and a short offline session followed by reconnection.

RECOVERY
XP, pending changes and interrupted-save information are stored together on the device. A save whose response was lost is checked against the server before pending XP is cleared. If the outcome cannot be resolved, automatic writes pause. Use Export Backup and retain the JSON before clearing browser data or making further changes. The backup is for recovery and inspection; this version has no automatic import.

LIMITS
The existing CountAPI service uses public keys and read/set operations. Four-digit codes are not private accounts and can collide. Simultaneous play on different devices can overwrite XP. Matching an interrupted write by its target value cannot prove which device wrote that value. These client changes reduce failure modes but cannot guarantee loss-free or exactly-once synchronization. Use one playing device at a time with this backend. A production replacement needs authenticated accounts, atomic changes and unique operation IDs.

Modern browsers with the Web Locks API allow one active app tab per browser origin. Close the active tab and reload the other to transfer control. Older browsers without Web Locks should use one tab only.

VALIDATION
Automated mocked checks covered migration, answers earned during a save, recovery when a response is lost after a successful write, pausing ambiguous saves, negative XP clamping, inactive tabs, JavaScript syntax and the 100 vocabulary option sets. Live service availability, mobile speech and actual cross-device operation were not tested.
