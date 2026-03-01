#!/usr/bin/env node
import { JClawAgent } from '../runtime/agent.js';
import { createSimpleMemoryClient } from '../context/simple-memory-client.js';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
const VERSION = packageJson.version;

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
🧬 JClaw - Universal Self-Evolving Agent Framework

用法:
  jclaw <command> [options]

命令:
  execute <prompt>     执行任务
  chat                 交互模式
  init                 初始化项目
  help                 显示帮助

环境变量:
  LLM_API_KEY          API 密钥
  LLM_BASE_URL         API 地址
  LLM_MODEL_NAME       模型名称
`);
}

async function loadLLMConfig() {
  if (existsSync('./jclaw.config.js')) {
    try {
      const config = await import('./jclaw.config.js');
      const { llm, providers } = config.default || config;
      if (llm && llm.provider && providers && providers[llm.provider]) {
        const provider = providers[llm.provider];
        const apiKey = process.env[provider.apiKeyEnv];
        if (!apiKey) {
          console.error(`❌ 请设置 ${provider.apiKeyEnv}`);
          process.exit(1);
        }
        return {
          apiBase: provider.baseURL,
          apiKey: apiKey,
          model: llm.model || provider.models[0]
        };
      }
      if (llm && llm.apiKey) {
        return {
          apiBase: llm.apiBase || 'https://api.openai.com/v1',
          apiKey: llm.apiKey,
          model: llm.model || 'gpt-4'
        };
      }
    } catch (e) {}
  }
  return null;
}

async function getLLMConfig() {
  const configFile = await loadLLMConfig();
  if (configFile) return configFile;
  
  if (process.env.LLM_API_KEY) {
    return {
      apiBase: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL_NAME || 'gpt-4',
      temperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : 1.0
    };
  }
  
  if (process.env.OPENAI_API_KEY) {
    return {
      apiBase: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.LLM_MODEL_NAME || 'gpt-4',
      temperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : 1.0
    };
  }
  
  console.error('❌ 请设置 LLM_API_KEY 或 OPENAI_API_KEY');
  process.exit(1);
}

async function execute(prompt) {
  const llmConfig = await getLLMConfig();
  console.log('🧬 启动 JClaw...\n');
  console.log(`📡 模型：${llmConfig.model}`);
  console.log(`🔌 API: ${llmConfig.apiBase}\n`);

  const agent = new JClawAgent({
    name: 'jclaw-cli',
    version: VERSION,
    enableAutoSkill: true,
    skillShConfig: { enableCache: true },
    llm: llmConfig,
    contextManager: createSimpleMemoryClient({
      enableSynonyms: true,
      enableFuzzyMatch: true
    })
  });

  await agent.start();
  console.log('✅ JClaw 已启动\n');
  console.log('📝 任务:', prompt, '\n');

  const result = await agent.execute({ id: 'cli-task', prompt });

  console.log('\n✅ 结果:\n');
  console.log(result.output || result.error);
  await agent.stop();
  console.log('\n🎉 完成！\n');
}

async function chat() {
  const llmConfig = await getLLMConfig();
  console.log('🧬 JClaw 交互模式 (输入 "exit" 退出)\n');
  console.log(`📡 模型：${llmConfig.model}\n`);

  const agent = new JClawAgent({ name: 'jclaw-chat', version: VERSION, enableAutoSkill: true, llm: llmConfig });
  await agent.start();

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = () => {
    rl.question('你：', async (input) => {
      if (input.toLowerCase() === 'exit') {
        await agent.stop();
        rl.close();
        console.log('\n👋 再见！\n');
        return;
      }
      console.log('\n🤖 JClaw:\n');
      const result = await agent.execute({ id: 'chat', prompt: input });
      console.log(result.output || result.error);
      console.log('');
      ask();
    });
  };
  ask();
}

async function init() {
  console.log('🧬 初始化 JClaw 项目...\n');
  const configTemplate = `export default {
  enableAutoSkill: true,
  llm: { provider: 'openai', model: 'gpt-4' },
  providers: {
    'openai': {
      baseURL: 'https://api.openai.com/v1',
      apiKeyEnv: 'OPENAI_API_KEY',
      models: ['gpt-4', 'gpt-4o']
    }
  }
};
`;
  if (!existsSync('jclaw.config.js')) {
    await writeFile('jclaw.config.js', configTemplate);
    console.log('✅ 创建：jclaw.config.js');
  }
  console.log('\n🎉 初始化完成！\n');
}

switch (command) {
  case 'execute':
  case 'exec':
  case 'e':
    const prompt = args.slice(1).join(' ');
    if (!prompt) {
      console.error('❌ 请提供任务描述');
      process.exit(1);
    }
    execute(prompt);
    break;
  case 'chat':
  case 'c':
    chat();
    break;
  case 'init':
  case 'i':
    init();
    break;
  case 'help':
  case 'h':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      execute(args.join(' '));
    } else {
      showHelp();
    }
}

// Add temperature env var support
