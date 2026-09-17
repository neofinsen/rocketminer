import type { Asteroid, GameState, Projectile } from './types';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getLaserLevel = (state: GameState) =>
  state.modules.find((module) => module.key === 'laser')?.level ?? 1;

export const getIdleLaserInterval = (state: GameState) =>
  clamp((14 - getLaserLevel(state) * 0.45) * 0.58, 4.5, 8);

export const getIdleLaserDamage = (laserDamage: number) =>
  Math.max(24, Math.round(laserDamage * 0.24));

const findIdleAsteroidTarget = (
  rocket: GameState['rocket'],
  asteroids: Asteroid[],
) =>
  asteroids
    .map((asteroid) => ({
      asteroid,
      distance: Math.hypot(asteroid.x - rocket.x, asteroid.y - rocket.y),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.asteroid;

export const queueIdleProjectile = ({
  asteroids,
  laserDamage,
  nextId,
  projectiles,
  rocket,
}: {
  asteroids: Asteroid[];
  laserDamage: number;
  nextId: number;
  projectiles: Projectile[];
  rocket: GameState['rocket'];
}) => {
  const asteroid = findIdleAsteroidTarget(rocket, asteroids);
  if (!asteroid) return { projectiles, nextId };

  return {
    projectiles: [
      ...projectiles,
      {
        id: nextId,
        x: rocket.x,
        y: rocket.y,
        targetX: asteroid.x,
        targetY: asteroid.y,
        asteroidId: asteroid.id,
        damage: getIdleLaserDamage(laserDamage),
      },
    ],
    nextId: nextId + 1,
  };
};
