// API endpoint. On the office PC running the server this stays localhost;
// for other desktops / phones set it to that PC's LAN address,
// e.g. 'http://192.168.1.50:3001'
window.API_BASE = localStorage.getItem('api_base') || 'http://localhost:3001';
