import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	ICredentialTestFunctions,
	INodeCredentialTestResult,
	ICredentialsDecrypted,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { createKafkaClient, parseBrokers } from './shared/kafkaConfig';
import { COMPRESSION_OPTIONS } from './shared/constants';
import { compressionProperty } from './shared/descriptions';
import { isSchemaRegistryEnabled, getSchemaRegistry, encodeMessage } from './shared/schemaRegistry';

function buildHeaders(headersData?: {
	header?: Array<{ key: string; value: string }>;
}): Record<string, string> | undefined {
	if (!headersData?.header?.length) return undefined;
	const headers: Record<string, string> = {};
	for (const h of headersData.header) {
		if (h.key) {
			headers[h.key] = h.value;
		}
	}
	return Object.keys(headers).length > 0 ? headers : undefined;
}

export class KafkaExtended implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kafka Extended',
		name: 'kafkaExtended',
		icon: { light: 'file:../../icons/kafka.svg', dark: 'file:../../icons/kafka.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Send messages to Kafka with compression and Schema Registry support',
		defaults: {
			name: 'Kafka Extended',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'kafkaExtendedApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Topic',
				name: 'topic',
				type: 'string',
				default: '',
				placeholder: 'my-topic',
				description: 'Kafka topic to produce to',
				required: true,
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Message value to send (supports n8n expressions)',
				required: true,
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				description: 'Message key for partitioning',
			},
			compressionProperty,
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Acks',
						name: 'acks',
						type: 'options',
						options: [
							{ name: 'None (0)', value: 0 },
							{ name: 'Leader (1)', value: 1 },
							{ name: 'All ISR (-1)', value: -1 },
						],
						default: -1,
						description: 'Number of required acknowledgements',
					},
					{
						displayName: 'Headers',
						name: 'headers',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								name: 'header',
								displayName: 'Header',
								values: [
									{
										displayName: 'Key',
										name: 'key',
										type: 'string',
										default: '',
										description: 'Header key',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Header value',
									},
								],
							},
						],
						description: 'Key-value message headers',
					},
					{
						displayName: 'Timeout (Ms)',
						name: 'timeout',
						type: 'number',
						default: 30000,
						description: 'Producer send timeout in milliseconds',
					},
					{
						displayName: 'Use Schema Registry for Producing',
						name: 'useSchemaRegistryForProducing',
						type: 'boolean',
						default: false,
						description:
							'Whether to encode the message value using Schema Registry (requires Schema Registry configured in credentials)',
					},
				],
			},
		],
	};

	methods = {
		credentialTest: {
			async kafkaExtendedConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data!;
				const brokers = parseBrokers(credentials.brokers as string);
				const clientId = credentials.clientId as string;

				try {
					const kafka = createKafkaClient(brokers, clientId);
					const admin = kafka.admin();
					await admin.connect();
					await admin.disconnect();
					return {
						status: 'OK',
						message: 'Connection successful',
					};
				} catch (error) {
					return {
						status: 'Error',
						message: (error as Error).message,
					};
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const credentials = await this.getCredentials('kafkaExtendedApi');
		const brokers = parseBrokers(credentials.brokers as string);
		const clientId = credentials.clientId as string;

		// Schema Registry setup
		const useRegistry = isSchemaRegistryEnabled(credentials);
		const registry = useRegistry ? getSchemaRegistry(credentials) : null;

		const kafka = createKafkaClient(brokers, clientId);
		const producer = kafka.producer();
		await producer.connect();

		const returnData: INodeExecutionData[] = [];

		try {
			for (let i = 0; i < items.length; i++) {
				try {
					const topic = this.getNodeParameter('topic', i) as string;
					const message = this.getNodeParameter('message', i) as string;
					const key = this.getNodeParameter('key', i, '') as string;
					const compression = this.getNodeParameter('compression', i, 0) as number;
					const options = this.getNodeParameter('options', i, {}) as IDataObject;

					const headers = buildHeaders(
						options.headers as { header?: Array<{ key: string; value: string }> } | undefined,
					);

					const useRegistryForProducing =
						useRegistry && ((options.useSchemaRegistryForProducing as boolean) || false);

					let messageValue: string | Buffer = message;
					if (useRegistryForProducing && registry) {
						// Parse message as JSON for schema encoding
						let parsedMessage: unknown;
						try {
							parsedMessage = JSON.parse(message);
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'Message must be valid JSON when using Schema Registry for producing',
							);
						}
						messageValue = await encodeMessage(registry, topic, parsedMessage);
					}

					const result = await producer.send({
						topic,
						compression,
						acks: (options.acks as number) ?? -1,
						timeout: (options.timeout as number) ?? 30000,
						messages: [
							{
								key: key || undefined,
								value: messageValue,
								headers,
							},
						],
					});

					returnData.push({
						json: {
							topic,
							partition: result[0].partition,
							offset: result[0].baseOffset,
							timestamp: result[0].timestamp,
							compression: COMPRESSION_OPTIONS.find((c) => c.value === compression)?.name ?? 'None',
							schemaRegistry: useRegistryForProducing,
						},
						pairedItem: { item: i },
					});
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({
							json: { error: (error as Error).message },
							pairedItem: { item: i },
						});
						continue;
					}
					throw error;
				}
			}
		} finally {
			await producer.disconnect();
		}

		return [returnData];
	}
}
