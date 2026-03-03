export const COMPRESSION_OPTIONS = [
	{ name: 'None', value: 0 },
	{ name: 'GZIP', value: 1 },
	{ name: 'Snappy', value: 2 },
	{ name: 'LZ4', value: 3 },
	{ name: 'ZSTD', value: 4 },
];

export const DEFAULT_SESSION_TIMEOUT = 30000;
export const DEFAULT_HEARTBEAT_INTERVAL = 10000;
export const DEFAULT_BATCH_SIZE = 1;
export const DEFAULT_FETCH_MAX_BYTES = 1048576; // 1MB
export const DEFAULT_MAX_IN_FLIGHT_REQUESTS = 1;
