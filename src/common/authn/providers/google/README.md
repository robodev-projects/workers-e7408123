# Auth0 Authn Provider

## Getting Credentials

1. Go to your [Google Cloud Console](https://console.cloud.google.com/) project.
2. Fill out `APIs & Services` -> `OAuth consent screen` if needed and set the [scopes](https://developers.google.com/identity/protocols/oauth2/scopes#oauth2):
    - `openid` (required)
    - `https://www.googleapis.com/auth/userinfo.email`
    - `https://www.googleapis.com/auth/userinfo.profile`
3. Get credentials on `APIs & Services` -> `Credentials` -> `Create Credentials` -> `OAuth client ID`
   - select `Web application`
   - set `Authorized origin` to your web client url ( development: `http://localhost:3000` )
   - set `Authorized redirect URIs` to the api url ( development `http://localhost:3000/authn/provider/google/callback` )

## Install

```bash
yarn add google-auth-library
```

## Configuration

```yaml
authn:
  google:
    audience: 'api'
```

```typescript
@Module({
  imports: [
    AuthnModule.forRoot([PrismaAuthnPersistorModule, GoogleAuthnModule]),
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthnMiddleware()).forRoutes('*');
  }
}
```
