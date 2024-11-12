# Queue

Run long-running tasks in the background over several instances.

## Example usage


### Enqueue a job
```typescript
import { Injectable } from '@nestjs/common';
import { QueueService } from '~common/queues/queue.service';

@Injectable()
export class MyConsumerService {
  constructor(
    private readonly queueService: QueueService,
  ) {}
  async startJob(): Promise<Job<MyProcessorData>> {
    const job = await this.queueService.enqueue('my-processor', { id: makeUUID() });
  }
}
```

### Register a processor
```typescript
import { Injectable } from '@nestjs/common';
import { RegisterProcessor } from '~common/queues';

export class MyProcessorData {
  @Expose()
  @IsString()
  readonly id!: string;
}

@Injectable()
export class MyService {
  constructor() {}

  @RegisterProcessor('my-processor', { timeout: 60, validate: MyProcessorData })
  async myProcessor(job: Job<MyProcessorData>): Promise<{ message: string }> {
    // do work until job.context.timeout seconds have passed
    return { message: 'done' };
  }
}
```

### Setup

```typescript
@Module({
  imports: [
    QueueModule.forRoot([HotwireQueueModule]),
  ]
})
export class AppModule {}
```

> See ./providers for provider specific configuration.

## Architecture

```mermaid
flowchart TD
  providerEvent(event)
  subgraph "QueueExecutorService"
    execute1[load processor]
    execute0[execute] --> execute1
    execute1 .-> execute1Error(error)

    execute2[handle exceptions]
  end

  enqueue0(enqueue) ---> enqueue1
  subgraph "QueueService"
    enqueue1[call preprocessor]
    enqueue2{processor set}
    enqueue4[load processor]

    enqueue3[validate data]

    enqueue3 --> enqueue5
    enqueue3 .-> enqueue3Error(error)
    enqueue4Error[error]

    enqueue5[send]
    enqueue6[handle exceptions]
  end
  enqueue6 --> enqueue7(return)

  providerEvent ---> providerHasProcessor

  subgraph "QueueProvider"
    enqueue1 --> providerPreprocessor[preprocessor]
    providerPreprocessor --> providerLoadProcessor
    providerLoadProcessor[load processor?] --> enqueue2
    enqueue1 .-> enqueue2
    enqueue5 --> providerSend[enqueue]
    providerSend --> enqueue6
    providerHasProcessor{internal\n processor} --> executeProviderProcessor

    providerHasProcessor .-> execute0
  end



  subgraph "QueueProcessorLoader"
    %% RegisterQueueProcessor .-> processorSettings
    %% RegisterQueueProcessor .-> processorFunction

    enqueue4 ---> processorSettings
    processorSettings ---> enqueue3
    enqueue2 --> enqueue3
    enqueue2 .-> enqueue4
    enqueue4 .-> enqueue4Error

    processorFunction --> execute2
    execute1 --> processorFunction
  end


```
