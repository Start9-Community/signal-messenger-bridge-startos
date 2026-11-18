import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.101:2',
  releaseNotes: {
    en_US: `Requires StartOS 0.4.2 or later. Security: disable JVM Base64 intrinsics to mitigate CVE-2026-114938 on affected AVX-512 x86 CPUs. ARM64 is unaffected; application-specific exploitability has not been verified. Existing JVM options are preserved.

Fixes clients on this server, such as OpenClaw's Signal channel, that StartOS 0.4.1 started rejecting.

Every client now needs an API key, including one on the same server. If you connected a client here without one, run Create API Key and add the token to that client. StartOS services that depend on Signal Messenger Bridge read their key automatically.`,
    es_ES: `Requiere StartOS 0.4.2 o posterior. Seguridad: se desactivan los intrínsecos Base64 de la JVM para mitigar CVE-2026-114938 en CPU x86 AVX-512 afectadas. ARM64 no está afectado; no se ha verificado la explotabilidad específica de la aplicación. Se conservan las opciones JVM existentes.

Corrige los clientes de este servidor, como el canal de Signal de OpenClaw, que StartOS 0.4.1 empezó a rechazar.

Ahora todo cliente necesita una clave de API, incluso en el mismo servidor. Si conectó un cliente aquí sin clave, ejecute Crear clave de API y añada el token a ese cliente. Los servicios de StartOS que dependen de Signal Messenger Bridge leen su clave automáticamente.`,
    de_DE: `Erfordert StartOS 0.4.2 oder neuer. Sicherheit: JVM-Base64-Intrinsics zur Minderung von CVE-2026-114938 auf betroffenen AVX-512-x86-CPUs deaktiviert. ARM64 ist nicht betroffen; die anwendungsspezifische Ausnutzbarkeit wurde nicht bestätigt. Bestehende JVM-Optionen bleiben erhalten.

Behebt Clients auf diesem Server, etwa den Signal-Kanal von OpenClaw, die StartOS 0.4.1 abzulehnen begann.

Jeder Client braucht jetzt einen API-Schlüssel, auch auf demselben Server. Wenn Sie hier einen Client ohne Schlüssel verbunden haben, führen Sie „API-Schlüssel erstellen“ aus und tragen Sie das Token in diesem Client ein. StartOS-Dienste, die von Signal Messenger Bridge abhängen, lesen ihren Schlüssel automatisch.`,
    pl_PL: `Wymaga StartOS 0.4.2 lub nowszego. Bezpieczeństwo: wyłączono intrinsics Base64 JVM, aby ograniczyć CVE-2026-114938 na podatnych procesorach x86 AVX-512. ARM64 nie jest podatny; nie potwierdzono możliwości wykorzystania w tej aplikacji. Zachowano dotychczasowe opcje JVM.

Naprawia klientów na tym serwerze, takich jak kanał Signal w OpenClaw, które StartOS 0.4.1 zaczął odrzucać.

Każdy klient potrzebuje teraz klucza API, także na tym samym serwerze. Jeśli podłączono tu klienta bez klucza, uruchom Utwórz klucz API i dodaj token do tego klienta. Usługi StartOS zależne od Signal Messenger Bridge odczytują swój klucz automatycznie.`,
    fr_FR: `Nécessite StartOS 0.4.2 ou une version ultérieure. Sécurité : désactivation des intrinsèques Base64 de la JVM pour atténuer CVE-2026-114938 sur les processeurs x86 AVX-512 concernés. ARM64 n’est pas affecté ; l’exploitabilité propre à l’application n’a pas été vérifiée. Les options JVM existantes sont conservées.

Corrige les clients de ce serveur, comme le canal Signal d’OpenClaw, que StartOS 0.4.1 a commencé à refuser.

Tout client a désormais besoin d’une clé API, même sur le même serveur. Si vous avez connecté ici un client sans clé, exécutez Créer une clé API et ajoutez le jeton à ce client. Les services StartOS qui dépendent de Signal Messenger Bridge lisent leur clé automatiquement.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
