import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class KafkaExtended implements ICredentialType {
	name = 'kafkaExtendedApi';

	displayName = 'Kafka Extended';

	documentationUrl = 'https://kafka.apache.org/documentation/';

	icon: Icon = { light: 'file:../icons/kafka.svg', dark: 'file:../icons/kafka.dark.svg' };

	// Kafka credentials are tested by connecting in the node itself (no HTTP-based test possible)
	testedBy = 'kafkaExtendedConnectionTest';

	properties: INodeProperties[] = [
		{
			displayName: 'Brokers',
			name: 'brokers',
			type: 'string',
			default: 'localhost:9092',
			placeholder: 'localhost:9092,localhost:9093',
			description: 'Comma-separated list of Kafka broker addresses',
			required: true,
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: 'n8n',
			description: 'Client identifier for the Kafka connection',
		},
		{
			displayName: 'Use Schema Registry',
			name: 'useSchemaRegistry',
			type: 'boolean',
			default: false,
			description:
				'Whether to use Confluent Schema Registry for Avro/JSON Schema/Protobuf encoding',
		},
		{
			displayName: 'Schema Registry URL',
			name: 'schemaRegistryUrl',
			type: 'string',
			default: '',
			placeholder: 'http://localhost:8081',
			description: 'URL of the Confluent Schema Registry',
			displayOptions: {
				show: {
					useSchemaRegistry: [true],
				},
			},
		},
		{
			displayName: 'Schema Registry Username',
			name: 'schemaRegistryUsername',
			type: 'string',
			default: '',
			description: 'Username for Schema Registry basic auth (leave empty if no auth)',
			displayOptions: {
				show: {
					useSchemaRegistry: [true],
				},
			},
		},
		{
			displayName: 'Schema Registry Password',
			name: 'schemaRegistryPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Password for Schema Registry basic auth (leave empty if no auth)',
			displayOptions: {
				show: {
					useSchemaRegistry: [true],
				},
			},
		},
	];
}
