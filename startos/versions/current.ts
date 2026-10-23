import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.101:0',
  releaseNotes: {
    en_US: `Release for the Community Registry.

- Runs the Signal client headless and exposes it over a REST and WebSocket API.
- Join Signal by linking the service to an existing account as a secondary device, the same way Signal Desktop does.
- API access is gated by bearer tokens created and revoked from StartOS actions.
- Updates to signal-cli-rest-api 0.101 (stable), signal-cli 0.14.8, and start-sdk 3.1.0.
- Back up before updating: signal-cli upgrades the account database from schema 30 to 31. Returning to the previous version requires restoring a pre-update backup.
- [Upstream release notes](https://github.com/bbernhard/signal-cli-rest-api/releases/tag/0.101).
- Revoke API Key and Trust Identity start with no key or contact selected.
- Signal Settings describes each choice for Do Not Download, Trust New Identities, Default Text Mode and Log Level.
- Trust Identity describes both ways to trust a key.`,
    es_ES: `Versión para el Registro Comunitario.

- Ejecuta el cliente de Signal sin interfaz y lo expone mediante una API REST y WebSocket.
- Únete a Signal enlazando el servicio a una cuenta existente como dispositivo secundario, igual que Signal Desktop.
- El acceso a la API está protegido por tokens de portador creados y revocados desde acciones de StartOS.
- Actualiza a signal-cli-rest-api 0.101 (estable), signal-cli 0.14.8 y start-sdk 3.1.0.
- Haz una copia de seguridad antes de actualizar: signal-cli actualiza la base de datos de cuentas del esquema 30 al 31. Para volver a la versión anterior es necesario restaurar una copia de seguridad previa a la actualización.
- [Notas de la versión del proyecto original](https://github.com/bbernhard/signal-cli-rest-api/releases/tag/0.101).
- Revocar clave de API y Confiar en identidad empiezan sin ninguna clave ni contacto seleccionado.
- Ajustes de Signal describe cada opción de No descargar, Confiar en identidades nuevas, Modo de texto por defecto y Nivel de registro.
- Confiar en identidad describe las dos formas de confiar en una clave.`,
    de_DE: `Veröffentlichung für die Community Registry.

- Betreibt den Signal-Client ohne Oberfläche und stellt ihn über eine REST- und WebSocket-API bereit.
- Tritt Signal bei, indem der Dienst wie Signal Desktop als Zweitgerät mit einem bestehenden Konto verknüpft wird.
- Der API-Zugriff wird durch Bearer-Tokens geschützt, die über StartOS-Aktionen erstellt und widerrufen werden.
- Aktualisiert auf signal-cli-rest-api 0.101 (stabil), signal-cli 0.14.8 und start-sdk 3.1.0.
- Vor dem Update ein Backup erstellen: signal-cli aktualisiert die Kontodatenbank von Schema 30 auf 31. Eine Rückkehr zur vorherigen Version erfordert die Wiederherstellung eines Backups von vor dem Update.
- [Upstream-Versionshinweise](https://github.com/bbernhard/signal-cli-rest-api/releases/tag/0.101).
- API-Schlüssel widerrufen und Identität bestätigen beginnen ohne ausgewählten Schlüssel oder Kontakt.
- Signal-Einstellungen beschreibt jede Option für Nicht herunterladen, Neuen Identitäten vertrauen, Standard-Textmodus und Protokollstufe.
- Identität bestätigen beschreibt beide Wege, einem Schlüssel zu vertrauen.`,
    pl_PL: `Wydanie dla Rejestru Społeczności.

- Uruchamia klienta Signal bez interfejsu i udostępnia go przez API REST i WebSocket.
- Dołącz do Signal, łącząc usługę z istniejącym kontem jako urządzenie dodatkowe, tak jak Signal Desktop.
- Dostęp do API jest chroniony tokenami bearer tworzonymi i unieważnianymi za pomocą akcji StartOS.
- Aktualizacja do signal-cli-rest-api 0.101 (wersja stabilna), signal-cli 0.14.8 i start-sdk 3.1.0.
- Przed aktualizacją wykonaj kopię zapasową: signal-cli aktualizuje bazę danych kont ze schematu 30 do 31. Powrót do poprzedniej wersji wymaga przywrócenia kopii zapasowej sprzed aktualizacji.
- [Informacje o wydaniu projektu źródłowego](https://github.com/bbernhard/signal-cli-rest-api/releases/tag/0.101).
- Unieważnij klucz API i Zaufaj tożsamości zaczynają bez wybranego klucza ani kontaktu.
- Ustawienia Signal opisują każdą opcję pól Nie pobieraj, Zaufanie nowym tożsamościom, Domyślny tryb tekstu i Poziom logowania.
- Zaufaj tożsamości opisuje oba sposoby zaufania kluczowi.`,
    fr_FR: `Version destinée au registre communautaire.

- Exécute le client Signal sans interface et l'expose via une API REST et WebSocket.
- Rejoignez Signal en liant le service à un compte existant en tant qu'appareil secondaire, comme Signal Desktop.
- L'accès à l'API est protégé par des jetons bearer créés et révoqués depuis des actions StartOS.
- Met à jour signal-cli-rest-api vers la version 0.101 (stable), signal-cli vers 0.14.8 et start-sdk vers 3.1.0.
- Effectuez une sauvegarde avant la mise à jour : signal-cli fait passer la base de données des comptes du schéma 30 au schéma 31. Revenir à la version précédente nécessite de restaurer une sauvegarde antérieure à la mise à jour.
- [Notes de version du projet amont](https://github.com/bbernhard/signal-cli-rest-api/releases/tag/0.101).
- Révoquer une clé API et Faire confiance à une identité démarrent sans clé ni contact sélectionné.
- Paramètres Signal décrit chaque choix de Ne pas télécharger, Faire confiance aux nouvelles identités, Mode de texte par défaut et Niveau de journalisation.
- Faire confiance à une identité décrit les deux façons de faire confiance à une clé.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
