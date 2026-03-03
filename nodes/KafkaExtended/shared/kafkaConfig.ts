import { Kafka, CompressionTypes, CompressionCodecs } from 'kafkajs';

let codecsRegistered = false;

export function registerCompressionCodecs(): void {
	if (codecsRegistered) return;

	// Snappy — pure JS, always available
	try {
		const SnappyCodec = require('kafkajs-snappy');
		CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
	} catch {
		console.warn('kafkajs-snappy not available, Snappy compression disabled');
	}

	// LZ4 — native bindings, may fail
	try {
		const LZ4Codec = require('kafkajs-lz4');
		CompressionCodecs[CompressionTypes.LZ4] = LZ4Codec;
	} catch {
		console.warn('kafkajs-lz4 not available, LZ4 compression disabled');
	}

	// ZSTD — native bindings, may fail
	try {
		const ZSTDCodec = require('@kafkajs/zstd');
		CompressionCodecs[CompressionTypes.ZSTD] = ZSTDCodec;
	} catch {
		console.warn('@kafkajs/zstd not available, ZSTD compression disabled');
	}

	codecsRegistered = true;
}

export function parseBrokers(brokersString: string): string[] {
	return brokersString
		.split(',')
		.map((b) => b.trim())
		.filter(Boolean);
}

export function createKafkaClient(brokers: string[], clientId: string): Kafka {
	registerCompressionCodecs();
	return new Kafka({ clientId, brokers });
}
