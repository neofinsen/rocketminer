import { BookOpen, FlaskConical, Play, RotateCcw } from 'lucide-react';
import { getAssetUrl, ROCKET_CATALOG } from '@/lib/game/rocketCatalog';
import type { RocketKey, RunRecord } from '@/lib/game/types';

type MenuMode = 'home' | 'rocket-select' | 'admin';

export function MainMenu({
  bestRun,
  currentRun,
  hasSave,
  mode,
  onContinue,
  onAdminRun,
  onNewRun,
  onSelectRocket,
  onSetMode,
  onStartTutorial,
  unlockedRockets,
}: {
  bestRun?: RunRecord;
  currentRun?: RunRecord;
  hasSave: boolean;
  mode: MenuMode;
  onContinue: () => void;
  onAdminRun: (rocket: RocketKey) => void;
  onNewRun: () => void;
  onSelectRocket: (rocket: RocketKey) => void;
  onSetMode: (mode: MenuMode) => void;
  onStartTutorial: () => void;
  unlockedRockets: RocketKey[];
}) {
  const adminMode = mode === 'admin';
  const bestRunRocket = bestRun
    ? ROCKET_CATALOG.find((rocket) => rocket.key === bestRun.rocket)
    : undefined;
  const currentRunRocket = currentRun
    ? ROCKET_CATALOG.find((rocket) => rocket.key === currentRun.rocket)
    : undefined;

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
          <>
            <div className="run-summary-grid">
              <div className="best-run-card">
                <span>Bester Run{bestRun?.status === 'active' ? ' · aktuell' : ''}</span>
                {bestRun ? (
                  <strong>Welle {bestRun.wave} · Run-Level {bestRun.runLevel}</strong>
                ) : (
                  <strong>Noch kein Run gespeichert</strong>
                )}
                <small>
                  {bestRun
                    ? `${bestRunRocket?.name ?? 'Unbekannte Rakete'} · spaeter bereit fuer Bestenlisten`
                    : 'Starte ein Abenteuer, damit hier dein Fortschritt sichtbar wird.'}
                </small>
              </div>
              <div className="best-run-card current">
                <span>Aktueller Run</span>
                {currentRun ? (
                  <strong>Welle {currentRun.wave} · Run-Level {currentRun.runLevel}</strong>
                ) : (
                  <strong>Kein laufender Run</strong>
                )}
                <small>
                  {currentRun
                    ? `${currentRunRocket?.name ?? 'Unbekannte Rakete'} · nicht abgeschlossen`
                    : 'Sobald du ein Abenteuer startest, steht der Zwischenstand hier.'}
                </small>
              </div>
            </div>
            <div className="main-menu-actions">
              <button disabled={!hasSave} onClick={onContinue} type="button">
                <Play size={18} />
                Alten Spielstand fortsetzen
              </button>
              <button onClick={onNewRun} type="button">
                <RotateCcw size={18} />
                Neuen Run starten
              </button>
              <button onClick={onStartTutorial} type="button">
                <BookOpen size={18} />
                Tutorial starten
              </button>
              <button onClick={() => onSetMode('admin')} type="button">
                <FlaskConical size={18} />
                Admin-Testpanel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rocket-select-grid">
              {ROCKET_CATALOG.map((rocket) => {
                const enabled = adminMode || unlockedRockets.includes(rocket.key);

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
                    {adminMode ? `Admin · ${rocket.genre}` : enabled ? 'Bereit' : 'Forschung noetig'}
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
