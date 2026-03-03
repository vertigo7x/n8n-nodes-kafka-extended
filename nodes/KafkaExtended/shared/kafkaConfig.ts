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

	// ZSTD — WASM-based, no native bindings required
	try {
		const { Zstd } = require('@hpcc-js/wasm-zstd');
		let zstdInstance: Awaited<ReturnType<typeof Zstd.load>> | null = null;

		const getZstd = async () => {
			if (!zstdInstance) {
				zstdInstance = await Zstd.load();
			}
			return zstdInstance;
		};

		CompressionCodecs[CompressionTypes.ZSTD] = () => ({
			async compress(encoder: { buffer: Buffer }) {
				const zstd = await getZstd();
				return Buffer.from(zstd.compress(encoder.buffer));
			},
			async decompress(buffer: Buffer) {
				const zstd = await getZstd();
				return Buffer.from(zstd.decompress(buffer));
			},
		});
	} catch {
		console.warn('@hpcc-js/wasm-zstd not available, ZSTD compression disabled');
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
