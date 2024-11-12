# AWS SES Email Provider

## Setup

```typescript
import { Module } from '@nestjs/common';
import { EmailModule } from '~common/email';
import { AwsSesEmailModule } from '~common/email/providers/aws-ses';

@Module({
  imports: [
    EmailModule.forRoot([AwsSesEmailModule, PrismaEmailTemplateModule]),
  ],
})
export class AppModule {}
```

## Config

```yaml
email:
  defaultFrom: info@example.com
  awsSes:

    # Use when deploying outside of AWS services
    accessKeyId: random-key
    secretAccessKey: random-secret
    region: us-east-1

    # Use for testing
    apiEndpoint: http://localhost:4566
```
