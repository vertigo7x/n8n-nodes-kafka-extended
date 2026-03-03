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
	];
}
