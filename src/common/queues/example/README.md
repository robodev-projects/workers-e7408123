## Queue Examples

This is a playground for testing and experimenting with different queue implementations.

### Getting Started

Add to AppModule

```typescript
@Module({
  imports: [
    QueueModule.forRoot([HotwireQueueService]),
    QueueExampleModule,
  ]
})
export class AppModule {}
```
