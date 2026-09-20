import { sdk } from '../sdk'
import { i18n } from '../i18n'
import {
  MEDIA_KINDS,
  MediaKind,
  SETTINGS_DEFAULTS,
  SignalSettings,
  storeJson,
} from '../fileModels/store.json'
import { isRunning, readSettings, settingsEqual } from '../settings'

const { InputSpec, Value } = sdk

/**
 * The container settings an operator can change.
 *
 * Upstream describes every one of these as advanced and says the defaults are
 * fine, so this is a flat form with no setup flow: open it, change the one
 * thing, save. What is *not* here is as deliberate as what is — `MODE` is
 * load-bearing (json-rpc is what makes the receive stream exist),
 * `AUTO_RECEIVE_SCHEDULE` is fatal under json-rpc, and the port and config dir
 * are contracts with interfaces.ts and the backup layout.
 *
 * All of them are launch-time env, so saving a change restarts the container.
 * That happens here rather than through a reactive read in main, so an
 * unchanged save costs nothing and the operator is told which it was.
 */
const inputSpec = InputSpec.of({
  skipMedia: Value.multiselect({
    name: i18n('Do Not Download'),
    description: i18n(
      'Media signal-cli fetches automatically as messages arrive. Skip a kind to save disk and bandwidth. Skipping attachments means whatever consumes this API can never retrieve them — there is nothing stored to serve.',
    ),
    default: [...SETTINGS_DEFAULTS.skipMedia],
    values: {
      attachments: i18n('Attachments'),
      stories: i18n('Stories'),
      avatars: i18n('Avatars'),
      stickers: i18n('Stickers'),
    },
  }),
  trustNewIdentities: Value.select({
    name: i18n('Trust New Identities'),
    description: i18n(
      'What to do when a contact presents a key this service has not seen. On first use matches Signal itself. Always removes the warning that a key changed, which is the signal of an intercepted conversation. Never blocks messaging with that contact until you run Trust Identity.',
    ),
    default: SETTINGS_DEFAULTS.trustNewIdentities,
    values: {
      'on-first-use': i18n('On first use (recommended)'),
      always: i18n('Always'),
      never: i18n('Never — trust each contact by hand'),
    },
  }),
  defaultTextMode: Value.select({
    name: i18n('Default Text Mode'),
    description: i18n(
      'How message text is interpreted when the sender does not say. Styled enables Signal formatting such as bold and italics.',
    ),
    default: SETTINGS_DEFAULTS.defaultTextMode,
    values: {
      normal: i18n('Normal'),
      styled: i18n('Styled'),
    },
  }),
  logLevel: Value.select({
    name: i18n('Log Level'),
    description: i18n(
      'How much the container writes to the service log. Debug is for diagnosing a problem; it is verbose and can include message metadata.',
    ),
    default: SETTINGS_DEFAULTS.logLevel,
    values: {
      debug: i18n('Debug'),
      info: i18n('Info'),
      warn: i18n('Warn'),
      error: i18n('Error'),
    },
  }),
})

export const signalSettingsAction = sdk.Action.withInput(
  'signal-settings',
  async () => ({
    name: i18n('Signal Settings'),
    description: i18n('Advanced service settings.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('General'),
    visibility: 'enabled',
  }),
  inputSpec,
  async () => readSettings(),
  async ({ effects, input }) => {
    const previous = await readSettings()
    const settings: SignalSettings = {
      // Re-derive the order from the canonical list so a saved file's array
      // order can't make an unchanged form look changed.
      skipMedia: MEDIA_KINDS.filter((kind) =>
        input.skipMedia.includes(kind),
      ) as MediaKind[],
      trustNewIdentities: input.trustNewIdentities,
      defaultTextMode: input.defaultTextMode,
      logLevel: input.logLevel,
    }

    if (settingsEqual(previous, settings)) {
      return {
        version: '1',
        title: i18n('No Changes'),
        message: i18n(
          'These settings already match what the service is running.',
        ),
        result: null,
      }
    }

    await storeJson.merge(effects, { settings })

    // Every setting is read by the image at launch and never again, so a change
    // is inert until the container restarts.
    const running = await isRunning(effects)
    if (running) await sdk.restart(effects)

    return {
      version: '1',
      title: i18n('Settings Saved'),
      message: running
        ? i18n('Restarting the service to apply the change.')
        : i18n('The change takes effect the next time the service starts.'),
      result: null,
    }
  },
)
