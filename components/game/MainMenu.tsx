import { FlaskConical, Play, RotateCcw } from 'lucide-react';
import { getAssetUrl, ROCKET_CATALOG } from '@/lib/game/rocketCatalog';
import type { RocketKey } from '@/lib/game/types';

type MenuMode = 'home' | 'rocket-select' | 'admin';

export function MainMenu({
  hasSave,
  mode,
  onContinue,
  onAdminRun,
  onNewRun,
  onSelectRocket,
  onSetMode,
}: {
  hasSave: boolean;
  mode: MenuMode;
  onContinue: () => void;
  onAdminRun: (rocket: RocketKey) => void;
  onNewRun: () => void;
  onSelectRocket: (rocket: RocketKey) => void;
  onSetMode: (mode: MenuMode) => void;
}) {
  const adminMode = mode === 'admin';

  return (
    <main className="main-menu">
      <section className="main-menu-panel">
        <span className="main-menu-kicker">Rocketminer</span>
        <h1>{adminMode ? 'Admin-Testlabor' : 'Abenteuer starten'}</h1>
        <p>
          {adminMode
            ? 'Teste jede Rakete mit ihrer eigenen Welt, ohne Freischaltung.'
            : 'Waehle spaeter deine freigeschaltete Rakete. Im Moment ist nur die Starterrakete einsatzbereit.'}
        </p>

        {mode === 'home' ? (
          <div className="main-menu-actions">
            <button disabled={!hasSave} onClick={onContinue} type="button">
              <Play size={18} />
              Alten Spielstand fortsetzen
            </button>
            <button onClick={onNewRun} type="button">
              <RotateCcw size={18} />
              Neuen Run starten
            </button>
            <button onClick={() => onSetMode('admin')} type="button">
              <FlaskConical size={18} />
              Admin-Testpanel
            </button>
          </div>
        ) : (
          <>
            <div className="rocket-select-grid">
              {ROCKET_CATALOG.map((rocket) => {
                const enabled = adminMode || rocket.unlocked;

                return (
                <button
                  className={enabled ? 'rocket-select-card' : 'rocket-select-card locked'}
                  disabled={!enabled}
                  key={rocket.key}
                  onClick={() =>
                    adminMode ? onAdminRun(rocket.key) : onSelectRocket(rocket.key)
                  }
                  type="button"
                >
                  <img alt="" src={getAssetUrl(rocket.rocketAsset)} />
                  <strong>{rocket.name}</strong>
                  <small>
                    {adminMode ? `Admin · ${rocket.genre}` : rocket.unlocked ? 'Bereit' : 'Gesperrt'}
                  </small>
                </button>
                );
              })}
            </div>
            <button className="menu-back-button" onClick={() => onSetMode('home')} type="button">
              Zurueck
            </button>
          </>
        )}
      </section>
    </main>
  );
}
