const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const { randomUUID } = require('node:crypto')
const { test } = require('node:test')
const { runInNewContext } = require('node:vm')
const ts = require('typescript')

function load(path, dependencies) {
  const exports = {}
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  })
  runInNewContext(outputText, {
    exports,
    console,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
      return dependencies[name]
    },
  })
  return exports
}

async function launch(skipMedia = []) {
  const daemons = {}
  const chain = {
    addOneshot(name, config) {
      daemons[name] = config
      return this
    },
    addDaemon(name, config) {
      daemons[name] = config
      return this
    },
    addHealthCheck() {
      return this
    },
  }
  const sdk = {
    setupMain: (fn) => fn,
    SubContainer: { of: () => ({}) },
    Mounts: { of: () => ({ mountVolume: () => ({}) }) },
    Daemons: { of: () => chain },
    useEntrypoint: () => ['/init'],
  }
  const utils = load('startos/utils.ts', { './sdk': { sdk } })
  const settings = load('startos/settings.ts', {
    '@start9labs/start-sdk': {},
    './sdk': { sdk },
    './fileModels/store.json': {},
    './utils': utils,
  })
  const { main } = load('startos/main.ts', {
    './sdk': { sdk },
    './i18n': { i18n: (value) => value },
    './settings': {
      ...settings,
      readSettings: async () => ({
        trustNewIdentities: 'never',
        defaultTextMode: 'styled',
        logLevel: 'warn',
        skipMedia,
      }),
    },
    './signal-client': {},
    './utils': utils,
  })
  await main({ effects: {} })
  return daemons
}

test('launch hardening retains settings, ownership preparation and upstream JVM option ownership', async () => {
  for (const skipMedia of [
    [],
    ['attachments', 'stories', 'avatars', 'stickers'],
  ]) {
    const daemons = await launch(skipMedia)
    const daemon = daemons['signal-api']
    const env = daemon.exec.env
    assert.equal(env.JAVA_TOOL_OPTIONS, '-XX:-UseBASE64Intrinsics')
    assert.equal(env.JAVA_OPTS, undefined)
    assert.equal(env.SIGNAL_CLI_OPTS, undefined)
    assert.equal(env.MODE, 'json-rpc')
    assert.equal(env.JSON_RPC_TRUST_NEW_IDENTITIES, 'never')
    assert.equal(env.DEFAULT_SIGNAL_TEXT_MODE, 'styled')
    assert.equal(env.LOG_LEVEL, 'warn')
    assert.equal(env.SIGNAL_CLI_CONFIG_DIR, '/data/signal-cli')
    for (const kind of ['attachments', 'stories', 'avatars', 'stickers']) {
      assert.equal(
        env[`JSON_RPC_IGNORE_${kind.toUpperCase()}`],
        skipMedia.includes(kind) ? 'true' : undefined,
      )
    }
    assert.equal(env.AUTO_RECEIVE_SCHEDULE, undefined)
    assert.equal(env.SIGNAL_CLI_CMD_TIMEOUT, undefined)
    assert.equal(daemon.exec.runAsInit, true)
    assert.deepEqual(daemon.exec.command, ['/init'])
    assert.deepEqual(Array.from(daemon.requires), ['claim-config-dir'])
    assert.equal(daemons['claim-config-dir'].exec.user, 'root')
    assert.equal(daemons['claim-config-dir'].exec.env, env)
  }
})

test('API keys protect both plaintext and TLS proxy legs', async () => {
  for (const keys of [[], ['dependent-key', 'operator-key']]) {
    let binding
    const sdk = {
      setupInterfaces: (fn) => fn,
      MultiHost: {
        of: () => ({
          bindPort: async (_port, options) => {
            binding = options
            return { export: async (interfaces) => interfaces }
          },
        }),
      },
      createInterface: (_effects, options) => options,
    }
    const { setInterfaces } = load('startos/interfaces.ts', {
      './sdk': { sdk },
      './i18n': { i18n: (value) => value },
      './utils': { apiHostId: 'api', port: 8080 },
      './fileModels/credentials.json': {
        credentialsJson: {
          read: (select) => ({
            const: async () => select({ apiKey: keys[0] }),
          }),
        },
      },
      './fileModels/store.json': {
        storeJson: {
          read: (select) => ({
            const: async () =>
              select({ apiKeys: keys.slice(1).map((token) => ({ token })) }),
          }),
        },
      },
    })
    await setInterfaces({ effects: {} })
    assert.equal(binding.protocol, 'http')
    assert.deepEqual(Object.keys(binding.addSsl), [])
    assert.equal(binding.proxy.auth.type, 'bearer')
    assert.deepEqual(Array.from(binding.proxy.auth.tokens), keys)
  }
})

test(
  's6 and jsonrpc2-helper propagate hardening and existing JAVA_OPTS to the actual signal-cli JVM',
  {
    skip: !process.env.SIGNAL_TEST_IMAGE,
  },
  async () => {
    const { exec } = (await launch())['signal-api']
    const name = `signal-jvm-test-${randomUUID()}`
    let result
    try {
      result = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--name',
          name,
          '--tmpfs',
          '/data/signal-cli:uid=1000,gid=1000,mode=0700',
          ...Object.entries(exec.env).flatMap(([key, value]) => [
            '-e',
            `${key}=${value}`,
          ]),
          '-e',
          `JAVA_TOOL_OPTIONS=${exec.env.JAVA_TOOL_OPTIONS} -XX:+PrintFlagsFinal`,
          '-e',
          'JAVA_OPTS=-Djdk.lang.Process.launchMechanism=vfork -Dstart9.test=preserved -XshowSettings:properties',
          process.env.SIGNAL_TEST_IMAGE,
        ],
        { encoding: 'utf8', timeout: 20000, maxBuffer: 8 * 1024 ** 2 },
      )
    } finally {
      spawnSync('docker', ['rm', '-f', name], { encoding: 'utf8' })
    }
    const output = `${result.stdout}\n${result.stderr}`
    assert.match(output, /UseBASE64Intrinsics\s*=\s*false/)
    assert.match(output, /jdk.lang.Process.launchMechanism\s*=\s*vfork/)
    assert.match(output, /start9.test\s*=\s*preserved/)
    assert.match(output, /sun.java.command\s*=\s*org.asamk.signal.Main/)
    assert.equal(result.error?.code, 'ETIMEDOUT', output)
    console.log(
      'Verified s6 -> jsonrpc2-helper -> signal-cli JVM: Base64 intrinsics disabled; inherited JAVA_OPTS/vfork retained',
    )
  },
)
