import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.101:2',
  releaseNotes: {
    en_US:
      'Mitigates Java4Shell (CVE-2026-114938) on affected x86-64 processors with AVX-512 VBMI. Details: https://calif.io/java4shell/',
    es_ES:
      'Mitiga Java4Shell (CVE-2026-114938) en procesadores x86-64 afectados con AVX-512 VBMI. Detalles: https://calif.io/java4shell/',
    de_DE:
      'Entschärft Java4Shell (CVE-2026-114938) auf betroffenen x86-64-Prozessoren mit AVX-512 VBMI. Details: https://calif.io/java4shell/',
    pl_PL:
      'Łagodzi podatność Java4Shell (CVE-2026-114938) na podatnych procesorach x86-64 z AVX-512 VBMI. Szczegóły: https://calif.io/java4shell/',
    fr_FR:
      'Atténue Java4Shell (CVE-2026-114938) sur les processeurs x86-64 concernés dotés d’AVX-512 VBMI. Détails : https://calif.io/java4shell/',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
