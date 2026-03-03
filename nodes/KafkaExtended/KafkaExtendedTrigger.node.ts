import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { createKafkaClient, parseBrokers } from './shared/kafkaConfig';
import {
	DEFAULT_SESSION_TIMEOUT,
	DEFAULT_HEARTBEAT_INTERVAL,
	DEFAULT_BATCH_SIZE,
	DEFAULT_FETCH_MAX_BYTES,
	DEFAULT_MAX_IN_FLIGHT_REQUESTS,
} from './shared/constants';
import type { IHeaders } from 'kafkajs';

function formatHeaders(headers?: IHeaders): IDataObject {
	if (!headers) return {};
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(headers)) {
		if (Buffer.isBuffer(value)) {
			result[key] = value.toString();
		} else if (value !== undefined && value !== null) {
			result[key] = String(value);
		}
	}
	return result;
}

export class KafkaExtendedTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Kafka Extended Trigger',
		name: 'kafkaExtendedTrigger',
		icon: { light: 'file:../../icons/kafka.svg', dark: 'file:../../icons/kafka.dark.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Consume messages from Kafka with Snappy/LZ4/ZSTD compression support',
		defaults: {
			name: 'Kafka Extended Trigger',
		},
		inputs: [],
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
				description: 'Kafka topic to consume from',
				required: true,
			},
			{
				displayName: 'Group ID',
				name: 'groupId',
				type: 'string',
				default: '',
				placeholder: 'my-consumer-group',
				description: 'Consumer group ID',
				required: true,
			},
			{
				displayName: 'From Beginning',
				name: 'fromBeginning',
				type: 'boolean',
				default: false,
				description: 'Whether to read from the earliest offset on first connect',
			},
			{
				displayName: 'JSON Parse Message',
				name: 'jsonParseMessage',
				type: 'boolean',
				default: false,
				description: 'Whether to parse the message value as JSON',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Allow Auto Topic Creation',
						name: 'allowAutoTopicCreation',
						type: 'boolean',
						default: false,
						description: 'Whether to allow auto-creation of topic on subscribe',
					},
					{
						displayName: 'Auto Commit Interval (Ms)',
						name: 'autoCommitInterval',
						type: 'number',
						default: 5000,
						description: 'Auto-commit interval in milliseconds',
					},
					{
						displayName: 'Auto Commit Threshold',
						name: 'autoCommitThreshold',
						type: 'number',
						default: 0,
						description: 'Commit after N resolved messages (0 = disabled)',
					},
					{
						displayName: 'Batch Size',
						name: 'batchSize',
						type: 'number',
						default: DEFAULT_BATCH_SIZE,
						description: 'Number of messages per workflow emit',
					},
					{
						displayName: 'Fetch Max Bytes',
						name: 'fetchMaxBytes',
						type: 'number',
						default: DEFAULT_FETCH_MAX_BYTES,
						description: 'Maximum bytes per fetch request',
					},
					{
						displayName: 'Heartbeat Interval (Ms)',
						name: 'heartbeatInterval',
						type: 'number',
						default: DEFAULT_HEARTBEAT_INTERVAL,
						description: 'Heartbeat interval in milliseconds',
					},
					{
						displayName: 'Max In-Flight Requests',
						name: 'maxInFlightRequests',
						type: 'number',
						default: DEFAULT_MAX_IN_FLIGHT_REQUESTS,
						description: 'Maximum number of concurrent requests to Kafka',
					},
					{
						displayName: 'Return Headers',
						name: 'returnHeaders',
						type: 'boolean',
						default: false,
						description: 'Whether to include Kafka message headers in the output',
					},
					{
						displayName: 'Session Timeout (Ms)',
						name: 'sessionTimeout',
						type: 'number',
						default: DEFAULT_SESSION_TIMEOUT,
						description: 'Session timeout in milliseconds',
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const credentials = await this.getCredentials('kafkaExtendedApi');
		const brokers = parseBrokers(credentials.brokers as string);
		const clientId = credentials.clientId as string;

		const topic = this.getNodeParameter('topic') as string;
		const groupId = this.getNodeParameter('groupId') as string;
		const fromBeginning = this.getNodeParameter('fromBeginning') as boolean;
		const jsonParseMessage = this.getNodeParameter('jsonParseMessage') as boolean;
		const options = this.getNodeParameter('options') as IDataObject;

		const kafka = createKafkaClient(brokers, clientId);
		const consumer = kafka.consumer({
			groupId,
			sessionTimeout: (options.sessionTimeout as number) || DEFAULT_SESSION_TIMEOUT,
			heartbeatInterval: (options.heartbeatInterval as number) || DEFAULT_HEARTBEAT_INTERVAL,
			maxInFlightRequests:
				(options.maxInFlightRequests as number) || DEFAULT_MAX_IN_FLIGHT_REQUESTS,
			allowAutoTopicCreation: (options.allowAutoTopicCreation as boolean) || false,
		});

		const batchSize = (options.batchSize as number) || DEFAULT_BATCH_SIZE;
		const returnHeaders = (options.returnHeaders as boolean) || false;

		const startConsumer = async () => {
			await consumer.connect();
			await consumer.subscribe({
				topic,
				fromBeginning,
			});

			await consumer.run({
				autoCommitInterval: (options.autoCommitInterval as number) || 5000,
				autoCommitThreshold: (options.autoCommitThreshold as number) || undefined,
				eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
					const messages: INodeExecutionData[] = [];

					for (const message of batch.messages) {
						if (!isRunning() || isStale()) break;

						let value: string | IDataObject = '';
						if (message.value) {
							const rawValue = message.value.toString();
							if (jsonParseMessage) {
								try {
									value = JSON.parse(rawValue) as IDataObject;
								} catch {
									value = rawValue;
								}
							} else {
								value = rawValue;
							}
						}

						const item: INodeExecutionData = {
							json: {
								topic: batch.topic,
								partition: batch.partition,
								offset: message.offset,
								timestamp: message.timestamp,
								key: message.key?.toString() ?? null,
								value,
								...(returnHeaders ? { headers: formatHeaders(message.headers) } : {}),
							},
						};

						messages.push(item);
						resolveOffset(message.offset);

						if (messages.length >= batchSize) {
							this.emit([messages.splice(0, messages.length)]);
							await heartbeat();
						}
					}

					if (messages.length > 0) {
						this.emit([messages]);
					}
				},
			});
		};

		const closeFunction = async () => {
			try {
				await consumer.stop();
				await consumer.disconnect();
			} catch {
				// Suppress disconnect errors — n8n wraps this in TriggerCloseError
			}
		};

		if (this.getMode() === 'manual') {
			return { closeFunction, manualTriggerFunction: startConsumer };
		}

		await startConsumer();
		return { closeFunction };
	}
}
