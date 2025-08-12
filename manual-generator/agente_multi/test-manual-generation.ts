import { AgnoSCore } from './core/AgnoSCore';
import { OrchestratorAgent } from './agents/OrchestratorAgent';

async function testManualGeneration(url: string, username: string, password: string) {
  const core = new AgnoSCore();
  const orchestratorAgent = new OrchestratorAgent();
  core.registerAgent(orchestratorAgent);

  await core.start();

  const testConfig = {
    targetUrl: url,
    authConfig: {
      type: 'basic',
      credentials: {
        username,
        password
      }
    },
    credentials: {
      username,
      password,
      loginUrl: url,
      customSteps: [
        { type: 'fill', selector: 'input[type="text"]', value: username },
        { type: 'fill', selector: 'input[type="password"]', value: password },
        { type: 'click', selector: 'button[type="submit"]' },
        { type: 'wait', selector: '', timeout: 3000 }
      ]
    },
    enableScreenshots: true,
    outputFormats: ['markdown'],
    maxRetries: 1,
    timeoutMinutes: 2
  };

  const result = await core.executeTask(
    'OrchestratorAgent',
    'generate_manual',
    testConfig,
    'high'
  );

  if (result.success) {
    console.log('✅ Manual gerado com sucesso!');
    if (result.markdownReport) {
      console.log(result.markdownReport);
    }
  } else {
    console.error('❌ Falha:', result.error);
  }

  await core.stop();
}

// Get command line arguments
const [url = '', username = '', password = ''] = process.argv.slice(2);

if (!url || !username || !password) {
  console.error('Usage: ts-node test-manual-generation.ts <url> <username> <password>');
  process.exit(1);
}

testManualGeneration(url, username, password).catch(console.error);