export const short = {
  en_US:
    'Drive Signal Messenger from your own software over a token-authenticated API.',
  es_ES:
    'Controla Signal Messenger desde tu propio software mediante una API autenticada por token.',
  de_DE:
    'Steuere Signal Messenger aus deiner eigenen Software über eine tokenauthentifizierte API.',
  pl_PL:
    'Steruj komunikatorem Signal z własnego oprogramowania przez API uwierzytelniane tokenem.',
  fr_FR:
    'Pilotez Signal Messenger depuis votre propre logiciel via une API authentifiée par jeton.',
}

export const long = {
  en_US: `Signal Messenger Bridge runs the Signal client headless and exposes the Signal network over a token-authenticated REST and WebSocket API, so bots, AI agents, scripts, and other StartOS services can send and receive Signal messages programmatically.

It is not a human chat app. There is no inbox to read or compose in — it is the machine-to-Signal on-ramp that your own software drives. For chatting by hand, use the Signal mobile or desktop apps.

This service joins Signal by linking to an existing account as a secondary device, the same way Signal Desktop does: scan a QR code from the Signal app on your phone and it is connected. Link your personal account and your software acts as you; create a separate Signal account on a spare number and link that instead if you would rather it have its own identity.

OpenClaw is an example consumer, using this service as an AI agent's Signal channel.`,
  es_ES: `Signal Messenger Bridge ejecuta el cliente de Signal sin interfaz y expone la red de Signal mediante una API REST y WebSocket autenticada por token, para que bots, agentes de IA, scripts y otros servicios de StartOS puedan enviar y recibir mensajes de Signal mediante programación.

No es una aplicación de chat para personas. No hay bandeja de entrada que leer ni donde escribir: es la vía de acceso de máquina a Signal que controla tu propio software. Para chatear a mano, usa las aplicaciones móviles o de escritorio de Signal.

Este servicio se une a Signal enlazándose a una cuenta existente como dispositivo secundario, igual que Signal Desktop: escanea un código QR desde la aplicación de Signal en tu teléfono y queda conectado. Enlaza tu cuenta personal y tu software actuará como tú; crea una cuenta de Signal aparte con un número libre y enlaza esa si prefieres que tenga su propia identidad.

OpenClaw es un ejemplo de consumidor, que usa este servicio como canal de Signal de un agente de IA.`,
  de_DE: `Signal Messenger Bridge betreibt den Signal-Client ohne Oberfläche und stellt das Signal-Netzwerk über eine tokenauthentifizierte REST- und WebSocket-API bereit, damit Bots, KI-Agenten, Skripte und andere StartOS-Dienste Signal-Nachrichten programmgesteuert senden und empfangen können.

Es ist keine Chat-App für Menschen. Es gibt keinen Posteingang zum Lesen oder Schreiben — es ist die Maschine-zu-Signal-Anbindung, die deine eigene Software steuert. Zum Chatten von Hand nutze die Signal-Apps für Mobilgeräte oder Desktop.

Dieser Dienst tritt Signal bei, indem er sich wie Signal Desktop als Zweitgerät mit einem bestehenden Konto verknüpft: Scanne einen QR-Code in der Signal-App auf deinem Telefon, und er ist verbunden. Verknüpfe dein persönliches Konto, und deine Software handelt als du; lege ein separates Signal-Konto mit einer freien Nummer an und verknüpfe dieses, wenn es lieber eine eigene Identität haben soll.

OpenClaw ist ein Beispiel für einen Konsumenten, der diesen Dienst als Signal-Kanal eines KI-Agenten nutzt.`,
  pl_PL: `Signal Messenger Bridge uruchamia klienta Signal bez interfejsu i udostępnia sieć Signal przez API REST i WebSocket uwierzytelniane tokenem, aby boty, agenci AI, skrypty i inne usługi StartOS mogły programowo wysyłać i odbierać wiadomości Signal.

To nie jest aplikacja czatu dla ludzi. Nie ma skrzynki odbiorczej do czytania ani pisania — to połączenie maszyny z Signal, którym steruje twoje własne oprogramowanie. Do ręcznego czatowania użyj aplikacji mobilnej lub desktopowej Signal.

Ta usługa dołącza do Signal, łącząc się z istniejącym kontem jako urządzenie dodatkowe, tak samo jak Signal Desktop: zeskanuj kod QR w aplikacji Signal na telefonie, a zostanie połączona. Połącz swoje konto osobiste, a oprogramowanie będzie działać jako ty; załóż osobne konto Signal na zapasowym numerze i połącz je, jeśli wolisz, aby miało własną tożsamość.

OpenClaw jest przykładowym konsumentem, który używa tej usługi jako kanału Signal dla agenta AI.`,
  fr_FR: `Signal Messenger Bridge exécute le client Signal sans interface et expose le réseau Signal via une API REST et WebSocket authentifiée par jeton, afin que des bots, des agents IA, des scripts et d'autres services StartOS puissent envoyer et recevoir des messages Signal par programmation.

Ce n'est pas une application de discussion pour humains. Il n'y a pas de boîte de réception à lire ni où écrire — c'est la passerelle machine-vers-Signal que votre propre logiciel pilote. Pour discuter à la main, utilisez les applications Signal mobiles ou de bureau.

Ce service rejoint Signal en se liant à un compte existant en tant qu'appareil secondaire, comme le fait Signal Desktop : scannez un QR code depuis l'application Signal sur votre téléphone et il est connecté. Liez votre compte personnel et votre logiciel agira en votre nom ; créez un compte Signal distinct sur un numéro libre et liez celui-ci si vous préférez qu'il ait sa propre identité.

OpenClaw est un exemple de consommateur, utilisant ce service comme canal Signal d'un agent IA.`,
}
