// Scripts for Firebase and Firebase messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfDTjY6qOP8_Ayr19oSEfOyFjMDeWNW0w",
  authDomain: "studysync-1da06.firebaseapp.com",
  projectId: "studysync-1da06",
  storageBucket: "studysync-1da06.firebasestorage.app",
  messagingSenderId: "104472249791",
  appId: "1:104472249791:web:587b1302aab8f49fdf8d0a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Or any icon you prefer
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});