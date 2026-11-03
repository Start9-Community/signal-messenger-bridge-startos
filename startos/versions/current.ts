import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.101:1',
  releaseNotes: {
    en_US: `Fixes clients on this server, such as OpenClaw's Signal channel, that StartOS 0.4.1 started rejecting.

Every client now needs an API key, including one on the same server. If you connected a client here without one, run Create API Key and add the token to that client. StartOS services that depend on Signal Messenger Bridge read their key automatically.`,
    es_ES: `Corrige los clientes de este servidor, como el canal de Signal de OpenClaw, que StartOS 0.4.1 empezó a rechazar.

Ahora todo cliente necesita una clave de API, incluso en el mismo servidor. Si conectó un cliente aquí sin clave, ejecute Crear clave de API y añada el token a ese cliente. Los servicios de StartOS que dependen de Signal Messenger Bridge leen su clave automáticamente.`,
    de_DE: `Behebt Clients auf diesem Server, etwa den Signal-Kanal von OpenClaw, die StartOS 0.4.1 abzulehnen begann.

Jeder Client braucht jetzt einen API-Schlüssel, auch auf demselben Server. Wenn Sie hier einen Client ohne Schlüssel verbunden haben, führen Sie „API-Schlüssel erstellen“ aus und tragen Sie das Token in diesem Client ein. StartOS-Dienste, die von Signal Messenger Bridge abhängen, lesen ihren Schlüssel automatisch.`,
    pl_PL: `Naprawia klientów na tym serwerze, takich jak kanał Signal w OpenClaw, które StartOS 0.4.1 zaczął odrzucać.

Każdy klient potrzebuje teraz klucza API, także na tym samym serwerze. Jeśli podłączono tu klienta bez klucza, uruchom Utwórz klucz API i dodaj token do tego klienta. Usługi StartOS zależne od Signal Messenger Bridge odczytują swój klucz automatycznie.`,
    fr_FR: `Corrige les clients de ce serveur, comme le canal Signal d’OpenClaw, que StartOS 0.4.1 a commencé à refuser.

Tout client a désormais besoin d’une clé API, même sur le même serveur. Si vous avez connecté ici un client sans clé, exécutez Créer une clé API et ajoutez le jeton à ce client. Les services StartOS qui dépendent de Signal Messenger Bridge lisent leur clé automatiquement.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
