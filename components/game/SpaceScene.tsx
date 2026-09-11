import type { CSSProperties } from 'react';
import { Progress } from '@/components/ui/progress';
import { RESOURCE_LABELS } from '@/lib/game/constants';
import {
  BASE_POSITION,
  formatNumber,
  getSectorDanger,
  getSectorLabel,
} from '@/lib/game/simulation';
import type {
  Asteroid,
  DamageText,
  Fragment,
  GameState,
  Projectile,
} from '@/lib/game/types';
import asteroidSheetImage from './assets/rocketminer-asteroid-sheet-desert.png';
import dropSheetImage from './assets/rocketminer-drop-sheet-desert.png';
import rocketImage from './assets/rocketminer-starter-rocket-desert.png';
import sectorAlphaImage from './assets/sector-alpha-bg-space.png';
import sectorBetaImage from './assets/sector-beta-bg-space.png';

const getAssetUrl = (asset: unknown) =>
  typeof asset === 'string' ? asset : (asset as { src: string }).src;

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
    </button>
  );
}

function FragmentSprite({ fragment }: { fragment: Fragment }) {
  return (
    <span
      className={`fragment fragment-${fragment.resource}`}
      style={{ left: `${fragment.x}%`, top: `${fragment.y}%` }}
      title={`${RESOURCE_LABELS[fragment.resource]} +${fragment.amount}`}
    />
  );
}

function GrabBeam({ state }: { state: GameState }) {
  const fragment = state.fragments.find(
    (item) => item.id === state.rocket.grabbedFragmentId,
  );
  if (!fragment) return null;

  const x = (state.rocket.x + fragment.x) / 2;
  const y = (state.rocket.y + fragment.y) / 2;
  const width = Math.hypot(fragment.x - state.rocket.x, fragment.y - state.rocket.y);
  const angle = Math.atan2(fragment.y - state.rocket.y, fragment.x - state.rocket.x);

  return (
    <span
      className="grab-beam"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        transform: `translate(-50%, -50%) rotate(${angle}rad)`,
      }}
    />
  );
}

function ProjectileSprite({ projectile }: { projectile: Projectile }) {
  return (
    <span
      className="projectile"
      style={{ left: `${projectile.x}%`, top: `${projectile.y}%` }}
    />
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
}: {
  state: GameState;
  onHitAsteroid: (id: number) => void;
}) {
  const sectorImage =
    state.currentSector === 'beta' ? sectorBetaImage : sectorAlphaImage;

  return (
    <section
      className={`space-scene sector-${state.currentSector}`}
      aria-label="Weltraumansicht"
      style={
        {
          '--asteroid-sheet-image': `url(${getAssetUrl(asteroidSheetImage)})`,
          '--drop-sheet-image': `url(${getAssetUrl(dropSheetImage)})`,
          '--rocket-image': `url(${getAssetUrl(rocketImage)})`,
          '--sector-bg-image': `url(${getAssetUrl(sectorImage)})`,
        } as CSSProperties
      }
    >
      <div className="sector-status">
        <h2>{getSectorLabel(state.currentSector)}</h2>
        <span>Gefahrenstufe: {getSectorDanger(state.currentSector)}</span>
        <Progress className="game-progress" value={state.sectorProgress} />
        <small>{Math.floor(state.sectorProgress)}% erkundet</small>
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

      <GrabBeam state={state} />

      <span
        className={`rocket ${state.rocket.status}`}
        style={{
          left: `${state.rocket.x}%`,
          top: `${state.rocket.y}%`,
          transform: `translate(-50%, -50%) rotate(${state.rocket.angle}deg)`,
        }}
        aria-label="Explorer I"
      >
        <span className="rocket-image" />
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

      {state.projectiles.map((projectile) => (
        <ProjectileSprite key={projectile.id} projectile={projectile} />
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
