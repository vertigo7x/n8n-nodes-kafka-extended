import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import type { IDataObject } from 'n8n-workflow';

let registryInstance: SchemaRegistry | null = null;
let lastRegistryUrl = '';

export type SchemaSubjectNameStrategy = 'topic' | 'record' | 'topicrecord';

export interface SchemaRegistryCredentials {
	useSchemaRegistry?: boolean;
	schemaRegistryUrl?: string;
	schemaRegistryUsername?: string;
	schemaRegistryPassword?: string;
}

export function isSchemaRegistryEnabled(credentials: IDataObject): boolean {
	return !!(credentials.useSchemaRegistry && credentials.schemaRegistryUrl);
}

export function getSchemaRegistry(credentials: IDataObject): SchemaRegistry {
	const url = credentials.schemaRegistryUrl as string;
	const username = credentials.schemaRegistryUsername as string | undefined;
	const password = credentials.schemaRegistryPassword as string | undefined;

	// Reuse instance if URL hasn't changed
	if (registryInstance && lastRegistryUrl === url) {
		return registryInstance;
	}

	const auth = username && password ? { auth: { username, password } } : {};

	registryInstance = new SchemaRegistry({
		host: url,
		...auth,
	});
	lastRegistryUrl = url;

	return registryInstance;
}

/**
 * Decode a Confluent wire-format buffer (magic byte + 4-byte schema ID + payload).
 * Returns the decoded JS object, or the original string if decoding fails or
 * the buffer doesn't have the Confluent wire-format prefix.
 */
export async function decodeMessage(
	registry: SchemaRegistry,
	buffer: Buffer | null,
): Promise<IDataObject | string | null> {
	if (!buffer || buffer.length < 5) return buffer?.toString() ?? null;

	// Confluent wire format: first byte is 0x00 (magic byte)
	if (buffer[0] !== 0x00) {
		return buffer.toString();
	}

	try {
		const decoded = await registry.decode(buffer);
		return decoded as IDataObject;
	} catch {
		// If decoding fails, return as raw string
		return buffer.toString();
	}
}

/**
 * Encode a value using Schema Registry.
 * Looks up the latest schema for the given subject according to the configured
 * subject naming strategy.
 */
export function getSchemaSubject(
	topic: string,
	strategy: SchemaSubjectNameStrategy,
	recordName?: string,
	isKey = false,
): string {
	if (strategy === 'topic') {
		return `${topic}-${isKey ? 'key' : 'value'}`;
	}

	if (!recordName?.trim()) {
		throw new Error('Record name is required when using Record or TopicRecord subject strategy');
	}

	const normalizedRecordName = recordName.trim();

	if (strategy === 'record') {
		return normalizedRecordName;
	}

	return `${topic}-${normalizedRecordName}`;
}

export async function encodeMessage(
	registry: SchemaRegistry,
	topic: string,
	value: unknown,
	strategy: SchemaSubjectNameStrategy = 'topic',
	recordName?: string,
	isKey = false,
): Promise<Buffer> {
	const subject = getSchemaSubject(topic, strategy, recordName, isKey);
	const schemaId = await registry.getLatestSchemaId(subject);
	return registry.encode(schemaId, value);
}
