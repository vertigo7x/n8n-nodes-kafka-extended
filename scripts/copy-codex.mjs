// Post-build step: copy the node codex (*.node.json) files into dist/.
// The n8n-node build (tsc) does not emit these JSON files to dist/, so they are
// copied here. Implemented in pure Node (no OS-specific shell) so it runs the
// same on local Windows and Linux CI. Paths are resolved relative to this file
// so the working directory does not matter.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDir, '..');

const srcDir = join(projectRoot, 'nodes', 'KafkaExtended');
const destDir = join(projectRoot, 'dist', 'nodes', 'KafkaExtended');

const codexFiles = ['KafkaExtended.node.json', 'KafkaExtendedTrigger.node.json'];

mkdirSync(destDir, { recursive: true });

for (const file of codexFiles) {
	copyFileSync(join(srcDir, file), join(destDir, file));
	console.log(`copied ${file} -> dist/nodes/KafkaExtended/${file}`);
}
