import { spawn } from 'child_process';
import path from 'path';

export async function renderPdfWithWorker(draft: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve(process.cwd(), 'scripts/pdfWorker.cjs');
    const worker = spawn('node', [workerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    worker.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    worker.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[pdfWorkerClient] stderr', data.toString());
    });

    worker.on('error', (error) => {
      console.error('[pdfWorkerClient] spawn error', error);
      reject(new Error(`Worker spawn failed: ${error.message}`));
    });

    worker.on('close', (code) => {
      if (code !== 0) {
        console.error('[pdfWorkerClient] worker exited with code', code);
        reject(new Error(`Worker exited with code ${code}\nstderr: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          reject(new Error(`Worker error: ${result.error}`));
          return;
        }
        if (result.data) {
          const buffer = Buffer.from(result.data, 'base64');
          console.log('[pdfWorkerClient] PDF generated', { length: buffer.length });
          resolve(buffer);
        } else {
          reject(new Error('Worker returned no data'));
        }
      } catch (e: any) {
        console.error('[pdfWorkerClient] parse error', e, 'stdout', stdout.slice(0, 500));
        reject(new Error(`Failed to parse worker output: ${e.message}`));
      }
    });

    try {
      worker.stdin.write(JSON.stringify({ draft }));
      worker.stdin.end();
    } catch (e: any) {
      reject(new Error(`Failed to send data to worker: ${e.message}`));
    }
  });
}
