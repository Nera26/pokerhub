import { MigrationInterface, QueryRunner } from 'typeorm';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'layout.skip': 'Skip to main content',
    'login.tagline': 'Join the community of poker enthusiasts!',
    'login.brandButton': 'Join the Community',
    'login.title': 'Login',
    'login.forgot': 'Forgot Password?',
    "login.noAccount": "Don't have an account?",
    'login.signUp': 'Sign Up',
    'login.footer.copyright': '\u00a9 2024 PokerHub. All rights reserved.',
    'login.footer.terms': 'Terms of Service',
    'login.footer.privacy': 'Privacy Policy',
    'serviceWorker.updatePrompt': 'A new version is available. Refresh now?',
    'serviceWorker.reload': 'Refresh',
    'serviceWorker.dismiss': 'Dismiss',
    'serviceWorker.offlineNotice':
      'You are offline. Changes will sync once connection is restored.',
    'offline.title': 'You are offline',
    'offline.body':
      'Some features may be unavailable. Please check your connection and try again.',
  },
  es: {
    'layout.skip': 'Saltar al contenido principal',
    'login.tagline': '¡Únete a la comunidad de entusiastas del póker!',
    'login.brandButton': 'Únete a la comunidad',
    'login.title': 'Iniciar sesión',
    'login.forgot': '¿Olvidaste tu contraseña?',
    'login.noAccount': '¿No tienes una cuenta?',
    'login.signUp': 'Regístrate',
    'login.footer.copyright': '\u00a9 2024 PokerHub. Todos los derechos reservados.',
    'login.footer.terms': 'Términos de servicio',
    'login.footer.privacy': 'Política de privacidad',
    'serviceWorker.updatePrompt': 'Hay una nueva versión disponible. ¿Actualizar ahora?',
    'serviceWorker.reload': 'Actualizar',
    'serviceWorker.dismiss': 'Cerrar',
    'serviceWorker.offlineNotice':
      'Estás sin conexión. Los cambios se sincronizarán cuando se restablezca la conexión.',
    'offline.title': 'Estás sin conexión',
    'offline.body':
      'Algunas funciones pueden no estar disponibles. Por favor, verifica tu conexión e inténtalo de nuevo.',
  },
};

export class SeedTranslations1757058400011 implements MigrationInterface {
  name = 'SeedTranslations1757058400011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "translations" ("lang" character varying NOT NULL, "key" character varying NOT NULL, "value" text NOT NULL, CONSTRAINT "PK_translations" PRIMARY KEY ("lang", "key"))`,
    );

    for (const [lang, messages] of Object.entries(TRANSLATIONS)) {
      for (const [key, value] of Object.entries(messages)) {
        await queryRunner.query(
          `INSERT INTO "translations" ("lang", "key", "value") VALUES ($1, $2, $3) ON CONFLICT ("lang", "key") DO NOTHING`,
          [lang, key, value],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "translations"`);
  }
}

