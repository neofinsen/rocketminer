import { MousePointer2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  canUnlockBeta,
  BASE_POSITION,
  formatNumber,
  getSectorDanger,
  getSectorLabel,
  unlockBetaCost,
} from '@/lib/game/simulation';
import type { Asteroid, DamageText, Fragment, GameState } from '@/lib/game/types';
import { ResourceIcon } from './ResourceIcon';

const starSeeds = Array.from({ length: 90 }, (_, index) => ({
  id: index,
  x: (index * 37) % 100,
  y: (index * 53) % 100,
  size: index % 7 === 0 ? 2 : 1,
}));

const smallRocks = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: 8 + ((index * 17) % 86),
  y: 10 + ((index * 29) % 78),
  size: 8 + (index % 4) * 4,
}));

function AsteroidSprite({
  asteroid,
  onHit,
}: {
  asteroid: Asteroid;
  onHit: (id: number) => void;
}) {
  const hpPercent = (asteroid.hp / asteroid.maxHp) * 100;

  return (
    <button
      className={`asteroid large ${asteroid.type}`}
      onClick={() => onHit(asteroid.id)}
      style={{ left: `${asteroid.x}%`, top: `${asteroid.y}%` }}
      aria-label={`${RESOURCE_LABELS[asteroid.resource]}-Asteroid abbauen`}
    >
      <span className="asteroid-label">
        <strong>{RESOURCE_LABELS[asteroid.resource]}-Asteroid</strong>
        <small>
          {formatNumber(asteroid.hp)} / {formatNumber(asteroid.maxHp)}
        </small>
        <Progress className="game-progress asteroid-progress" value={hpPercent} />
      </span>
      <span className="asteroid-rock" />
      <MousePointer2 className="asteroid-cursor" size={34} />
    </button>
  );
}

function FragmentSprite({ fragment }: { fragment: Fragment }) {
  return (
    <span
      className={`fragment ${fragment.resource}`}
      style={{ left: `${fragment.x}%`, top: `${fragment.y}%` }}
      title={`${RESOURCE_LABELS[fragment.resource]} +${fragment.amount}`}
    >
      <ResourceIcon resource={fragment.resource} />
    </span>
  );
}

function DamageSprite({ text }: { text: DamageText }) {
  return (
    <span
      className="damage-text"
      style={{ left: `${text.x}%`, top: `${text.y}%` }}
    >
      -{formatNumber(text.value)}
    </span>
  );
}

export function SpaceScene({
  state,
  onHitAsteroid,
  onUnlockBeta,
}: {
  state: GameState;
  onHitAsteroid: (id: number) => void;
  onUnlockBeta: () => void;
}) {
  const betaReady = canUnlockBeta(state);

  return (
    <section className="space-scene" aria-label="Weltraumansicht">
      <div className="sector-status">
        <h2>{getSectorLabel(state.currentSector)}</h2>
        <span>Gefahrenstufe: {getSectorDanger(state.currentSector)}</span>
        <Progress className="game-progress" value={state.sectorProgress} />
        <small>{Math.floor(state.sectorProgress)}% erkundet</small>
        {state.unlockedSectors.includes('beta') ? (
          <button className="sector-switch">Beta aktiv</button>
        ) : (
          <button
            className="sector-switch"
            disabled={!betaReady}
            onClick={onUnlockBeta}
            title={`${formatNumber(unlockBetaCost.titan ?? 0)} Titan, ${formatNumber(
              unlockBetaCost.crystal ?? 0,
            )} Kristall`}
          >
            Sektor Beta freischalten
          </button>
        )}
      </div>

      <div className="stars" aria-hidden="true">
        {starSeeds.map((star) => (
          <i
            key={star.id}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
          />
        ))}
      </div>

      {smallRocks.map((rock) => (
        <span
          className="small-rock"
          key={rock.id}
          style={{
            left: `${rock.x}%`,
            top: `${rock.y}%`,
            width: rock.size,
            height: rock.size,
          }}
        />
      ))}

      <span
        className="base-planet"
        style={{ left: `${BASE_POSITION.x}%`, top: `${BASE_POSITION.y}%` }}
        aria-label="Baseplanet"
      >
        <span className="base-orbit" />
        <span className="base-glow" />
        <span className="base-city" />
      </span>

      <span
        className="collector-radius"
        style={{ left: `${state.rocket.x}%`, top: `${state.rocket.y}%` }}
      />

      <span
        className="rocket"
        style={{
          left: `${state.rocket.x}%`,
          top: `${state.rocket.y}%`,
          transform: `translate(-50%, -50%) rotate(${state.rocket.angle}deg)`,
        }}
        aria-label="Explorer I"
      >
        <span className="rocket-body" />
        <span className="rocket-window" />
        <span className="rocket-fin left" />
        <span className="rocket-fin right" />
        <span className="rocket-flame" />
      </span>

      {state.fragments.map((fragment) => (
        <FragmentSprite fragment={fragment} key={fragment.id} />
      ))}

      {state.asteroids.map((asteroid) => (
        <AsteroidSprite
          asteroid={asteroid}
          key={asteroid.id}
          onHit={onHitAsteroid}
        />
      ))}

      {state.damageTexts.map((text) => (
        <DamageSprite key={text.id} text={text} />
      ))}

      <QuestCard state={state} />
    </section>
  );
}

function QuestCard({ state }: { state: GameState }) {
  const percent = (state.quest.current / state.quest.target) * 100;

  return (
    <div className="quest-card">
      <h2>Aktuelle Quest</h2>
      <p>{state.quest.done ? 'Quest-Kette abgeschlossen' : state.quest.title}</p>
      <small>{state.quest.hint}</small>
      <Progress className="game-progress quest-progress" value={percent} />
      <span>
        {state.quest.current} / {state.quest.target}
      </span>
    </div>
  );
}
