# Event-Driven Microservices Architecture

Technical specification for distributed asynchronous message dispatching across our service mesh.

## System Overview
- **Event Broker**: Apache Kafka / Redpanda cluster (multi-AZ replication)
- **Serialization Format**: Protocol Buffers (Protobuf v3)
- **Delivery Guarantee**: At-least-once with idempotent consumer processing

## Domain Event Interface Example

```typescript
export interface DomainEvent<T = Record<string, unknown>> {
  id: string;               // UUIDv4 unique event identifier
  aggregateId: string;      // Entity or aggregate root ID
  eventType: string;        // e.g., 'order.created', 'payment.settled'
  timestamp: number;        // Epoch millisecond timestamp
  version: number;          // Schema version for backwards compatibility
  payload: T;               // Strongly-typed payload data
  metadata: {
    correlationId: string;  // Trace ID for OpenTelemetry distributed tracing
    originService: string;  // Emitting microservice identifier
  };
}
```

## Production Reliability Checklist
- [x] Schema Registry validation enabled on producer pipelines
- [x] Dead Letter Queue (DLQ) configured with exponential backoff retry policy
- [x] Outbox pattern implemented with PostgreSQL transactional log tailing
- [ ] Cross-region failover cluster replication validated
- [ ] End-to-end distributed tracing with Jaeger / OpenTelemetry collectors

> **Note**: Consumers must implement deduplication cache (Redis TTL: 24h) using the event `id` to ensure idempotency during rebalances.
