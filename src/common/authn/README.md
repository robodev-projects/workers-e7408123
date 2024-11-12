# Authentication Module (authn)

Provides authentication services for the application.

## Glossary

- `AuthnIdentity`: A authenticated user's identity, the glue between the user and the provider.
- `AuthnSession`: A (usually in memory) session that is used to resolve a AuthnIdentity and cache it, allowing for faster access.
- `AuthnService`: A provider for storing and retrieving `AuthnIdentity` and `AuthnSession` as well as resolving them in the request.


- `UserModule`: The module that consumes the `AuthnModule` and provides the `UserEntity` and handled the user registration and management.
- `User`: The user of the application. This is the entity that is authenticated


- `AuthnProvider`: A provider for authentication, such as Google, Facebook, or a local username/password.
- `LocalAuthnProvider`: The local implementation of the `AuthnProvider` that uses a username and password or magic links.


- `authn`: Short for **Auth**enticatio**n**.
- `authz`: Short for **Auth**ori**z**ation. Not covered in this module - this us up to the UserModule.

## Strategies

### AuthIdentity Strategy

Use a provider to resolve the user's identity. This is the default strategy and is recommended for most applications.
The identity is stored locally, and it allows for multiple providers to be used (up to the User implementation).

> See [./providers](./providers) for the authentication providers.

Example:

```typescript
@Module({
  imports: [
    AuthnModule.forRoot([
      // persist the authnIdentity
      PrismaAuthnPersistorModule,

      // use your preferred authn provider(s)
      //  check their respective documentation for configuration
      //  some modules come with configurable enpoints for registration and login
      LocalAuthnModule,
      Auth0AuthnModule,
      GoogleAuthnModule,
    ]),

    // user implementation
    UserModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // define where the middleware should be applied
    //  this only applies the validated token, it does not protect the route
    consumer.apply(AuthnMiddleware()).forRoutes('*');
  }
}
```

Protect a route with the `Authenticated` decorator, allowing only authenticated AuthnIdentities to access the route.

```typescript
@Controller('my-controller')
export class MyController {
  @Get('authenticated-user')
  @Authenticated()
  async authedUser(@AuthnIdentity() auth: IAuthnIdentity): Promise<UserDto> {
    // The authnIdentity is available in this request, populated with the userId
    //  auth === { userId: '123', provider: 'local', 'type': 'user' };
  }
}
```

Notice the `type` of user in the `AuthnIdentity` object. This is used to differentiate between user types, such as `user` and `admin`.

To protect the route to only one type of user, or provider(s), you can pass parameters to the `Authenticated` decorator.

```typescript
export function AuthenticatedAdmin() {
  return Authenticated({ userType: ADMIN_AUTHN_KEY, provider: 'local' });
}
```

For registration purposes, you would not have a userIdentity, but still need to validate against the provider.

`AuthenticatedProvider` is used to ensure the user is authenticated ( optionally with the correct provider ).

```typescript
@Controller('my-controller')
export class MyController {
  @Get('provider-identity')
  @AuthenticatedProvider()
  async authedIdentity(@AuthnProviderIdentity() auth: IAuthnProviderIdentity): Promise<void> {
    // Only the provider details are available in this request
    //  auth === { id: '123', provider: 'google', providerData: {...} };
  }
}
```

### AuthnSession Strategy

Sessions store the `AuthnIdentity`, `AuthnProviderIdentity` and other data in a fast access cache. This can be used
in addition to any provider and is managed by the UserModule.

```yaml
authn:
  jwt:
    # encrypt the session and tokens
    secret: ${env.AUTHN_JWT_SECRET}

    # the maximum time before we re-validate with the authIdentity, 5 min in seconds
    accessTokenExpiration: 300

    # the maximum time before we re-validate with the authnProvider, 7 days in seconds
    refreshTokenExpiration: 604800

  session:
    enabled: true

    # extend the refresh token periodically
    # extendRefreshToken: true

```

To limit access to only sessions, use the `AuthnMiddleware` with the `session` option - note that registration and login routes
will need to set up their own authentication.

```typescript
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthnMiddleware({ session: true })).forRoutes('*');
  }
}
```

AuthnProvider can come with their own AuthnIdentity resolution - if they store the authId in their token. For that, you
need to extend `AuthnProvider.resolveAuthnIdentity`.

### AuthnProviderIdentity Strategy

This uses just the provider assigned id, often called a `sub` or `subject` to identify the user. If using this strategy, be sure
to store this external id in the user's profile as `email` can change. Only use this strategy if the provider itself
is critical to the application and the user's email (or other providers) will not be used.

Use the `AuthenticatedProvider` decorator to ensure the user is authenticated (with the correct provider).

Use the `@AuthnProviderIdentity() auth: IAuthnProviderIdentity` property decorator to access the provider details in
controller routes.

> User specific decorators like `Authenticated` will not work with this strategy.

Example:

```typescript
@Module({
  imports: [AuthnModule.forRoot([
    // import the provider(s) you want to use
    GoogleAuthnModule,
    // stores are not needed for this strategy
    NotImplementedAuthnPersistorModule
  ])],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // limit where the provider(s) are used
    consumer.apply(AuthnMiddleware({ provider: 'google' })).forRoutes('*');
  }
}
```

```typescript
@Controller('my-controller')
export class MyController {
  @Post('register')
  @AuthenticatedProvider({ provider: 'google' })
  async myRoute(@AuthnProviderIdentity() auth: IAuthnProviderIdentity): Promise<void> {
    // The provider details are available in the request, and with the decorator
    //  auth === { id: '123', provider: 'google', providerData: {...} };
  }
}
```

### Hotwire (Testing) Strategy

Use the `Hotwire` strategy to bypass authentication, making it easier to test routes that require authentication.

This can be used in combination with any of the strategies above as it supports all the same decorators.

See [./providers/hotwire](./providers/hotwire) for implementation details.

Example `Authorization: Bearer` headers:

- `Bearer {"userId": "7b8775ae-e687-491a-8e6b-eb6707f4ef43","type":"user"}`
- `Bearer {"providerId": "f2435thrregew"}`

## User Module

The `AuthnModule` is designed to be used with a UserModule (but not be dependent on any specific one), which provides the
user entity and registration routes.

The `UserModule` can use services from the AuthnModule to handle the user registration and management.

The `UserModule` is expected to provide the `UserEntity`, user registration, authorization, and user management.

### Registration and AuthnToken

Using the `AuthnIdentityPersistor`, the `UserModule` can create a user and store the `AuthnIdentity` in the
database. `AuthnService` provides access to the AuthnProviders.

> The (same named) `UserModule` provides examples [here](../../modules/user/account/user-account.service.ts)

For more direct use, the `AuthnProvider` itself can be included - this is useful for registering a User with a password in one step.

### Decorators

Extend the `Authnticated` decorator for user specific limitations, such as roles or permissions, or to populate the request with the user data.

```typescript
export function AuthenticatedUser() {
  return Authenticated({ userType: USER_AUTHN_KEY });
}
```

> Wrap AuthnIdentity Decorators instead of re-implementing them - the `authn` modules should serve as an abstraction layer.
