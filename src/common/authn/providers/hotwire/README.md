# Authn Hotwire Provider

> Should only be used for testing purposes.

## Usage

Calling an endpoint with the `@Authenticated()` decorator, you can inject the user identity using a prepared Bearer token.

Will inject any IAuthnIdentity data into the controller method.

Eq:

- Inject a userId with `Bearer {"userId": "4f142e6e-e5f8-4bfe-8c02-a62d39417648","type":"user"}`
- Inject a providerId with `Bearer {"providerId": "afesgrthrytu"}`

## Implementation

```typescript

@Module({
  imports: [
    AuthnModule.forRoot([NotImplementedAuthnPersistorModule, HotwireAuthnModule]),
  ],
  controllers: [MyController],
})
class AppModule {}

@Controller('my-endpoint')
class MyController {
  @Get('authnIdentity')
  @Authenticated()
  async details(@AuthnProviderIdentity() auth: IAuthnIdentity): Promise<AuthnProviderIdentityDto> {
    auth == {
      userId: '0000-0000-0000-0000',
    }
  }

  @Get('authnProviderIdentity')
  @Authenticated()
  async details(@AuthnIdentity() auth: IAuthnProviderIdentity): Promise<AuthnProviderIdentityDto> {
    auth == {
      providerId: '0000-0000-0000-0000',
      providerId: 'hotwire',
    }
  }
}


```
