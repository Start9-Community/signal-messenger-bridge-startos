import { setupManifest } from '@start9labs/start-sdk'
import { short, long } from './i18n'

export const manifest = setupManifest({
  // Keep `id` single-quoted on its own line: s9pk.mk scrapes it with awk to
  // name the built s9pk.
  id: 'signal-messenger-bridge',
  title: 'Signal Messenger Bridge',
  license: 'MIT',
  packageRepo:
    'https://github.com/Start9-Community/signal-messenger-bridge-startos',
  upstreamRepo: 'https://github.com/bbernhard/signal-cli-rest-api',
  marketingUrl: 'https://github.com/bbernhard/signal-cli-rest-api',
  donationUrl: null,
  description: { short, long },
  // `startos` is deliberately mountless: it carries package-owned state that
  // nothing inside the container should read. See fileModels/store.json.ts.
  volumes: ['main', 'startos'],
  images: {
    'signal-cli': {
      // Pinned, not `latest`: the tag decides which signal-cli ships, and an
      // unpinned rebuild can change the API surface silently. See UPDATING.md
      // for the bump runbook.
      source: { dockerTag: 'bbernhard/signal-cli-rest-api:0.203-dev' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
