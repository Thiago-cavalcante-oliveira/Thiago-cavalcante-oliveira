export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 600): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try { 
      return await fn(); 
    } catch (err) {
      lastErr = err;
      const jitter = Math.floor(Math.random() * 200);
      const wait = baseMs * Math.pow(2, i) + jitter;
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}