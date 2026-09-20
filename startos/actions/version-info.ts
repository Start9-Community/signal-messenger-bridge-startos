import { T } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { about } from '../signal-client'

/**
 * Report what the container is actually running: signal-cli's version, the
 * image build, and the API mode.
 *
 * Mode is the reason this exists rather than a nicety. `MODE=json-rpc` is a
 * requirement of this package, not a preference — it is what keeps one daemon
 * resident and makes the realtime receive stream available — and nothing else
 * surfaces whether it is in effect. The version is what UPDATING.md needs after
 * a tag bump.
 */
export const versionInfo = sdk.Action.withoutInput(
  'version-info',
  async () => ({
    name: i18n('Version Info'),
    description: i18n(
      'Show the signal-cli version and the API mode this service is running.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('General'),
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    let info
    try {
      info = await about(effects)
    } catch (err) {
      return {
        version: '1',
        title: i18n('Could Not Read Version Info'),
        message: (err as Error).message,
        result: null,
      }
    }

    const members: T.ActionResultMember[] = [
      {
        type: 'single',
        name: i18n('Version'),
        description: null,
        value: info.version,
        copyable: true,
        qr: false,
        masked: false,
      },
      {
        type: 'single',
        name: i18n('Mode'),
        description: i18n(
          'The realtime receive stream requires json-rpc mode.',
        ),
        value: info.mode,
        copyable: false,
        qr: false,
        masked: false,
      },
      {
        type: 'single',
        name: i18n('Build'),
        description: null,
        value: String(info.build),
        copyable: false,
        qr: false,
        masked: false,
      },
    ]

    if (info.versions?.length) {
      members.push({
        type: 'single',
        name: i18n('Supported API Versions'),
        description: null,
        value: info.versions.join(', '),
        copyable: false,
        qr: false,
        masked: false,
      })
    }

    // One member per endpoint rather than one blob, so this stays readable as
    // upstream adds endpoints. A capability disappearing across an image bump
    // is a silent break for whatever depends on it, which is the reason to
    // surface these at all — see UPDATING.md.
    const capabilities = Object.entries(info.capabilities ?? {})
    if (capabilities.length) {
      members.push({
        type: 'group',
        name: i18n('API Capabilities'),
        description: i18n(
          'Optional features the API reports per endpoint. Re-check these after a version bump — a missing one breaks whatever relied on it.',
        ),
        value: capabilities.map(([endpoint, features]) => ({
          type: 'single' as const,
          name: endpoint,
          description: null,
          value: features.join(', '),
          copyable: false,
          qr: false,
          masked: false,
        })),
      })
    }

    return {
      version: '1',
      title: i18n('Version Info'),
      // No message: Version / Mode / Build / API versions label themselves.
      message: null,
      result: {
        type: 'group',
        name: i18n('Version Info'),
        description: null,
        value: members,
      },
    }
  },
)
