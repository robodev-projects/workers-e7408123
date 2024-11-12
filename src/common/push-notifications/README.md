# Push notifications

## Sending messages

```typescript
@Controller('my-controller')
export class MyController {
  constructor(private readonly pushNotificationService: PushNotificationService,) {}

  @Get()
  @AuthenticatedUser()
  async send(
    @AuthnIdentity() auth: IAuthnIdentity,
  ): Promise<void> {
    await this.pushNotificationService.sendMessages(
      {
        resourceName: auth.userId,

        // background payload (app specific)
        // - in FCM, total message size is limited to 4096 bytes
        data: {},

        // notification payload (popups, system notifications)
        notification: {
          title: 'A message from the server',
          body: 'This is a test message',
          imageUri: 'https://example.com/image.jpg',
        },
      },
    );
  }
}
```

### Custom messages

```typescript

// manually subscribe to a topic
pushNotificationService.sendMessages(
  {
    // send to all tokens/topics of this resource
    resourceName: 'user-uuid',

    // and/or to these specific registered tokens
    tokens: ['1234567890'],

    // background payload (app specific)
    data: { },

    // notification payload (popups, system notifications)
    notification: {
      title: "Hello World"
    }
  },

  // optional, per provider spcific options
  {
    fcm: {
      notification: {
        imageUrl: "https://example.com/image.jpg"
      }
    }
  }
);

```

### Templates

#### Using Templates

```typescript

pushNotificationService.sendTemplate(
  {
    resource: "user-uuid",
    data: {},
  },
  "welcome-user",
  {
    name: "John Doe"
  }
);

```

#### Register Template

```typescript
export class HelloUserTemplateParameters {
  @Expose()
  @IsString()
  name!: string;
}

@Injectable()
export class HelloUserTemplateService {
  @RegisterPushNotificationTemplate({
    template: {
      name: 'hello-user',
      notification: {
        title: 'Hello, {{name}}!',
      },
    },
    validate: HelloUserTemplateParameters,
  })
  helloUser(message: IPushNotificationMessage) {

    // add more data to the message here

    return message;
  }
}
```

## Token Registration

To allow users to register their own tokens, you can enable the `PushNotificationTokenController`:

It will allow users to register their tokens to the resourceName of their own user id.

```yaml

push-notifications:
  tokenController: true
```

Manual registration and management is also possible via the `PushNotificationService`.


## Installation

Add to AppModule:

```typescript
@Module({
  imports: [PushNotificationModule.forRoot([PrismaPushNotificationModule, FcmPushNotificationModule])],
})
export class AppModule {}
```

See [./providers](./providers) for available providers.

Use in your service:

```typescript

@Module({
  imports: [PushNotificationModule],
  providers: [MyService]
})
export class MyModule {}

@Injectable()
export class MyService {
  constructor(private pushNotificationService: PushNotificationService) {}
}
```
