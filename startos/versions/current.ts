import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.101-pre:0',
  releaseNotes: {
    en_US: [
      'First release.',
      '',
      '- Runs the Signal client headless and exposes it over a REST and WebSocket API.',
      '- Join Signal by linking the service to an existing account as a secondary device, the same way Signal Desktop does.',
      '- API access is gated by bearer tokens managed from the API Keys action.',
    ].join('\n'),
    es_ES: [
      'Primera versión.',
      '',
      '- Ejecuta el cliente de Signal sin interfaz y lo expone mediante una API REST y WebSocket.',
      '- Únete a Signal enlazando el servicio a una cuenta existente como dispositivo secundario, igual que Signal Desktop.',
      '- El acceso a la API está protegido por tokens de portador gestionados desde la acción «Claves de API».',
    ].join('\n'),
    de_DE: [
      'Erste Veröffentlichung.',
      '',
      '- Betreibt den Signal-Client ohne Oberfläche und stellt ihn über eine REST- und WebSocket-API bereit.',
      '- Tritt Signal bei, indem der Dienst wie Signal Desktop als Zweitgerät mit einem bestehenden Konto verknüpft wird.',
      '- Der API-Zugriff wird durch Bearer-Tokens geschützt, die über die Aktion „API-Schlüssel“ verwaltet werden.',
    ].join('\n'),
    pl_PL: [
      'Pierwsze wydanie.',
      '',
      '- Uruchamia klienta Signal bez interfejsu i udostępnia go przez API REST i WebSocket.',
      '- Dołącz do Signal, łącząc usługę z istniejącym kontem jako urządzenie dodatkowe, tak jak Signal Desktop.',
      '- Dostęp do API jest chroniony tokenami bearer zarządzanymi w akcji „Klucze API”.',
    ].join('\n'),
    fr_FR: [
      'Première version.',
      '',
      "- Exécute le client Signal sans interface et l'expose via une API REST et WebSocket.",
      "- Rejoignez Signal en liant le service à un compte existant en tant qu'appareil secondaire, comme Signal Desktop.",
      "- L'accès à l'API est protégé par des jetons bearer gérés depuis l'action « Clés d'API ».",
    ].join('\n'),
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
