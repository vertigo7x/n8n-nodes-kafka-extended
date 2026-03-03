# n8n-nodes-kafka-extended

This is an n8n community node. It lets you use **Apache Kafka** in your n8n workflows with support for **Snappy, LZ4, and ZSTD** compression codecs — in addition to the built-in GZIP.

Apache Kafka is a distributed event streaming platform used for building real-time data pipelines and streaming applications.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Nodes

This package includes two nodes:

### Kafka Extended Trigger (Consumer)

Consumes messages from a Kafka topic and triggers workflow executions. Automatically decompresses messages encoded with GZIP, Snappy, LZ4, or ZSTD.

**Parameters:**

| Parameter          | Type    | Required | Description                                |
| ------------------ | ------- | -------- | ------------------------------------------ |
| Topic              | string  | Yes      | Kafka topic to consume from                |
| Group ID           | string  | Yes      | Consumer group ID                          |
| From Beginning     | boolean | No       | Read from earliest offset on first connect |
| JSON Parse Message | boolean | No       | Automatically parse message value as JSON  |

**Additional options:** Auto Commit Interval, Auto Commit Threshold, Batch Size, Fetch Max Bytes, Heartbeat Interval, Max In-Flight Requests, Return Headers, Session Timeout, Allow Auto Topic Creation.

**Output data shape:**

```json
{
	"topic": "my-topic",
	"partition": 0,
	"offset": "42",
	"timestamp": "1672531200000",
	"key": "my-key",
	"value": "message content or parsed JSON object",
	"headers": { "headerKey": "headerValue" }
}
```

### Kafka Extended (Producer)

Sends messages to a Kafka topic with selectable compression codec.

**Parameters:**

| Parameter   | Type    | Required | Description                                       |
| ----------- | ------- | -------- | ------------------------------------------------- |
| Topic       | string  | Yes      | Kafka topic to produce to                         |
| Message     | string  | Yes      | Message value (supports n8n expressions)          |
| Key         | string  | No       | Message key for partitioning                      |
| Compression | options | No       | None / GZIP / Snappy / LZ4 / ZSTD (default: None) |

**Additional options:** Acks (None / Leader / All ISR), Headers (key-value pairs), Timeout.

**Output data shape:**

```json
{
	"topic": "my-topic",
	"partition": 0,
	"offset": "123",
	"timestamp": "1672531200000",
	"compression": "Snappy"
}
```

## Credentials

This node uses the **Kafka Extended** credential type. Configure the following fields:

| Field     | Description                                    | Default        |
| --------- | ---------------------------------------------- | -------------- |
| Brokers   | Comma-separated list of Kafka broker addresses | localhost:9092 |
| Client ID | Client identifier for the Kafka connection     | n8n            |

Authentication is plaintext only. SASL/SSL is not currently supported.

The credential includes a connection test that verifies connectivity by connecting an admin client to the broker.

## Compression Codecs

| Codec  | Library          | Type             | Notes                                   |
| ------ | ---------------- | ---------------- | --------------------------------------- |
| GZIP   | Built-in (zlib)  | Always available | Native to Node.js                       |
| Snappy | `kafkajs-snappy` | Pure JavaScript  | Always available, no native compilation |
| LZ4    | `kafkajs-lz4`    | Native bindings  | Requires native compilation             |
| ZSTD   | `@kafkajs/zstd`  | Native bindings  | Requires native compilation             |

Codec registration is handled automatically at runtime. If LZ4 or ZSTD native bindings fail to compile in the target environment, those codecs will be unavailable but will not affect the other codecs. Snappy and GZIP are always available.

## Compatibility

- Tested with n8n v1.x
- Requires Node.js v22 or higher
- Uses [KafkaJS](https://kafka.js.org/) v2.x

## Usage

### Consuming messages

1. Add the **Kafka Extended Trigger** node to your workflow.
2. Configure the Kafka Extended credential with your broker addresses.
3. Set the **Topic** and **Group ID**.
4. Enable **JSON Parse Message** if your messages contain JSON payloads.
5. Activate the workflow. Messages will trigger workflow executions as they arrive.

### Producing messages

1. Add the **Kafka Extended** node to your workflow.
2. Configure the Kafka Extended credential.
3. Set the **Topic** and **Message** (supports n8n expressions like `{{ $json.data }}`).
4. Optionally set a **Key** for partition routing and select a **Compression** codec.

### Using as an AI tool

Both nodes have `usableAsTool` enabled, meaning they can be used as tools by AI Agent nodes in n8n.

## Development

```bash
# Install dependencies
npm install

# Start n8n with the nodes loaded (hot reload)
npm run dev

# Lint
npm run lint

# Build for production
npm run build
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [KafkaJS documentation](https://kafka.js.org/)

## License

[MIT](LICENSE.md)
