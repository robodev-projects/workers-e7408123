importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCfgh1wvVd6NL0KgSUvTHJLheup0NuKsww',
  authDomain: 'povio-orion.firebaseapp.com',
  projectId: 'povio-orion',
  storageBucket: 'povio-orion.appspot.com',
  messagingSenderId: '849358396114',
  appId: '1:849358396114:web:3b6f8f1c4f314cbfa6ab0b',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
