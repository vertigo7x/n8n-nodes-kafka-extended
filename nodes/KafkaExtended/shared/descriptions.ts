import type { INodeProperties } from 'n8n-workflow';
import { COMPRESSION_OPTIONS } from './constants';

export const topicProperty: INodeProperties = {
	displayName: 'Topic',
	name: 'topic',
	type: 'string',
	default: '',
	placeholder: 'my-topic',
	description: 'Name of the Kafka topic',
	required: true,
};

export const compressionProperty: INodeProperties = {
	displayName: 'Compression',
	name: 'compression',
	type: 'options',
	options: COMPRESSION_OPTIONS.map((c) => ({ name: c.name, value: c.value })),
	default: '',
	description: 'Compression codec to use when producing messages',
};
