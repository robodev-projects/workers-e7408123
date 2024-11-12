# Auth0 Authn Provider

## Install

```bash
yarn add auth0 jwks-rsa jsonwebtoken
```

## Configuration

```yaml
authn:
  auth0:
    issuer: 'https://tenant.auth0.com/'
    audience: 'api'
```

```typescript
@Module({
  imports: [
    AuthnModule.forRoot([PrismaAuthnPersistorModule, Auth0AuthnModule]),
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthnMiddleware()).forRoutes('*');
  }
}
```

todo: add auth0 import/export tool

## Local Development

The auth0 identity provider implementation comes with an additional mocking service - [localauth0](https://github.com/primait/localauth0) that can be used to fake a specific auth0 tenant and test if offline. This, for example, simplifies generating user's access token while developing locally.

`localauth0` is configured to be run as a docker container on port 3030. You can change this by editing the `docker-compose.yml` file.

Additional configuration of the auth0 tenant simulated by `localauth0` can be done by editing the LOCALAUTH0_CONFIG variable in `docker compose`. After each change, you need to restart the localauth0 container.

Other usage examples can be found in the [localauth0 GitHub repository](https://github.com/primait/localauth0?tab=readme-ov-file#apis)

Getting a token can be done on the build in website of the localauth0: `http://localhost:3030/`

Or by using the following curl command:

```bash
curl --request POST \
  --url http://localhost:3030/oauth/token \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: insomnia/9.3.3' \
  --data '{
	"client_id": "client_id",
  "client_secret": "client_secret",
  "audience": "api",
  "grant_type": "client_credentials"
}'
```

The response should look like this - the `access_token` is your `Bearer [token]`

```json
{
	"access_token": "xxx",
	"id_token": "xxx",
	"scope": "",
	"expires_in": 86400,
	"token_type": "Bearer"
}
```

### Config

```yaml
authn:
  auth0:
    issuer: 'https://prima.localauth0.com/'
    endpoint: 'http://localhost:3030/'
    audience: 'api'
```

### Docker Compose Service

```yaml
  localauth0:
    image: public.ecr.aws/primaassicurazioni/localauth0:0.8.0
    healthcheck:
      test: ['CMD', '/localauth0', 'healthcheck']
    ports:
      - '3030:3000'
    environment:
      LOCALAUTH0_CONFIG: |
        issuer = "http://localhost:3030/"
        [ user_info ]
        name = "Loalauth0"
        given_name = "Loalauth0"
        family_name = "Auth0"
        email = "developers@povio.com"
        email_verified = true
        [http]
        port = 3030
        [[audience]]
        name = "api"
```
