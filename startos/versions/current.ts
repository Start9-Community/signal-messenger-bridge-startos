import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.101-pre:1',
  releaseNotes: {
    en_US: [
      'Release for the Community Registry.',
      '',
      '- Runs the Signal client headless and exposes it over a REST and WebSocket API.',
      '- Join Signal by linking the service to an existing account as a secondary device, the same way Signal Desktop does.',
      '- API access is gated by bearer tokens created and revoked from StartOS actions.',
      "- Uses upstream's pre-release rootless image because no stable image includes that runtime yet.",
    ].join('\n'),
    es_ES: [
      'Versión para el Registro Comunitario.',
      '',
      '- Ejecuta el cliente de Signal sin interfaz y lo expone mediante una API REST y WebSocket.',
      '- Únete a Signal enlazando el servicio a una cuenta existente como dispositivo secundario, igual que Signal Desktop.',
      '- El acceso a la API está protegido por tokens de portador creados y revocados desde acciones de StartOS.',
      '- Usa la imagen sin privilegios de prelanzamiento del proyecto original porque ninguna imagen estable incluye todavía ese entorno.',
    ].join('\n'),
    de_DE: [
      'Veröffentlichung für die Community Registry.',
      '',
      '- Betreibt den Signal-Client ohne Oberfläche und stellt ihn über eine REST- und WebSocket-API bereit.',
      '- Tritt Signal bei, indem der Dienst wie Signal Desktop als Zweitgerät mit einem bestehenden Konto verknüpft wird.',
      '- Der API-Zugriff wird durch Bearer-Tokens geschützt, die über StartOS-Aktionen erstellt und widerrufen werden.',
      '- Verwendet das vorveröffentlichte Rootless-Image des Upstream-Projekts, da noch kein stabiles Image diese Laufzeit enthält.',
    ].join('\n'),
    pl_PL: [
      'Wydanie dla Rejestru Społeczności.',
      '',
      '- Uruchamia klienta Signal bez interfejsu i udostępnia go przez API REST i WebSocket.',
      '- Dołącz do Signal, łącząc usługę z istniejącym kontem jako urządzenie dodatkowe, tak jak Signal Desktop.',
      '- Dostęp do API jest chroniony tokenami bearer tworzonymi i unieważnianymi za pomocą akcji StartOS.',
      '- Używa przedpremierowego obrazu bez uprawnień roota, ponieważ żaden stabilny obraz nie zawiera jeszcze tego środowiska.',
    ].join('\n'),
    fr_FR: [
      'Version destinée au registre communautaire.',
      '',
      "- Exécute le client Signal sans interface et l'expose via une API REST et WebSocket.",
      "- Rejoignez Signal en liant le service à un compte existant en tant qu'appareil secondaire, comme Signal Desktop.",
      "- L'accès à l'API est protégé par des jetons bearer créés et révoqués depuis des actions StartOS.",
      "- Utilise l'image rootless en préversion du projet amont, car aucune image stable n'inclut encore cet environnement.",
    ].join('\n'),
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
