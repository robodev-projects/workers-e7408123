# FCM Push Notifications Provider

## Install packages

```bash
yarn add firebase-admin
```

## Configure
```yaml

push-notifications:
  fcm:
    # Firebase project unique ID
    projectId: 'povio-orion'

    # Firebase Cloud Messaging private key
    privateKey: |
      -----BEGIN PRIVATE KEY-----
      MGIWEFWEF=
      -----END PRIVATE KEY-----

    # FCM service account email address
    clientEmail: 'firebase-adminsdk-00000@povio-orion.iam.gserviceaccount.com'

```

## Add to AppModule

```typescript
PushNotificationModule.forRoot([FcmPushNotificationModule, PrismaPushNotificationPersistorModule]);
```

## Getting credentials

1. Create a Firebase account on [Firebase Console](https://console.firebase.google.com/u/0/).
2. Create a new project on your Firebase account (use one per environment)
3. Generate new Firebase Admin SDK private key
   - Navigate to "Project settings"
   - Select main tab "Service accounts"
   - Select tab "Firebase Admin SDK"
   - Click button "Generate new private key"


## Running the test client

In ./test-client, there is a full example of a webpage and worker that can be used to test the FCM provider.
You can get the config on the Firebase Console -> Project settings -> General -> Your apps -> Firebase SDK snippet -> Config.

```bash
npx http-server ./test-client
```
