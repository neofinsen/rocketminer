import { FastForward, RotateCcw, Shield } from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import {
  ADVENTURE_MAX_WAVE,
  createEnemies,
  getBaseRunSummary,
  getEnemyStats,
  getEnemyXpDrop,
  getRunFireCooldown,
  getRunChoicesForLevel,
  MAX_RUN_PROJECTILES,
  MAX_RUN_RAPID_FIRE,
  getRunPlayerDamage,
  getRunPlayerMaxHp,
  getRunPlayerSpeed,
  getRunProjectileCount,
  getRunXpTarget,
  getWaveReward,
  rewardText,
  type RunChoice,
  type RunSkillKey,
  type RunUpgradeKey,
} from '@/lib/game/adventureRun';
import { createCombat, createIdleCombat, createPlayerShots, getAimTarget } from '@/lib/game/adventureCombat';
import {
  formatNumber,
  getAdventureDeuteriumCost,
  getModuleLevel,
  getShieldStrength,
  getWeaponDamage,
} from '@/lib/game/simulation';
import { getAssetUrl, getRocketDefinition } from '@/lib/game/rocketCatalog';
import type { CombatState, Mode, Shot } from '@/lib/game/adventureTypes';
import type { GameState, ResourceBag, WeaponUpgradeChoice } from '@/lib/game/types';
import { RunChoicePanel } from './RunChoicePanel';

const TICK_SECONDS = 0.05;
const ADVENTURE_SPEED_SCALE = 3.9;
const ENEMY_HIT_RADIUS = 4.4;
const NOVA_RADIUS = 14;
const XP_PICKUP_RADIUS = 5.8;
const XP_MAGNET_RADIUS = 17;
const MAX_RAPID_FIRE_UPGRADES = 5;
const MAX_MULTI_SHOT_UPGRADES = 4;

const getFireCooldown = (
  weaponLevel: number,
  rapidFireLevel: number,
) => {
  const base = Math.max(0.34, 1.15 - weaponLevel * 0.035);
  const boost = Math.min(0.5, rapidFireLevel * 0.1);
  return base * (1 - boost);
};

const getPlayerMaxHp = (state: GameState) =>
  84 +
  getModuleLevel(state, 'energyCore') * 18 +
  getModuleLevel(state, 'cargo') * 7 +
  getShieldStrength(state);

export function AdventureView({
  state,
  onClaimReward,
  onChooseWeaponUpgrade,
  onRecordRun,
  onStartAdventure,
}: {
  state: GameState;
  onClaimReward: (reward: Partial<ResourceBag>) => void;
  onChooseWeaponUpgrade: (choice: WeaponUpgradeChoice) => void;
  onRecordRun: (summary: { wave: number; runLevel: number }) => void;
  onStartAdventure: () => boolean;
}) {
  const [combat, setCombat] = useState<CombatState>(() =>
    createIdleCombat(getPlayerMaxHp(state)),
  );
  const keys = useRef(new Set<string>());
  const pendingRewards = useRef<Partial<ResourceBag>[]>([]);
  const reportedRun = useRef('');
  const basePlayerDamage = useMemo(() => getWeaponDamage(state), [state]);
  const shieldStrength = getShieldStrength(state);
  const weaponLevel = getModuleLevel(state, 'weapon');
  const laserLevel = getModuleLevel(state, 'laser');
  const rapidFireLevel = state.weaponUpgrades.rapidFire;
  const rocket = getRocketDefinition(state.selectedRocket);
  const multiShotLevel = state.weaponUpgrades.multiShot;
  const baseProjectileCount = 1 + multiShotLevel;
  const playerDamage = getRunPlayerDamage(basePlayerDamage, combat.runUpgrades);
  const projectileCount = getRunProjectileCount(baseProjectileCount, combat.runUpgrades);
  const rapidFirePercent = Math.min(50, rapidFireLevel * 10);
  const hasWeaponUpgradeChoice =
    rapidFireLevel < MAX_RAPID_FIRE_UPGRADES ||
    multiShotLevel < MAX_MULTI_SHOT_UPGRADES;
  const pendingWeaponMilestone = hasWeaponUpgradeChoice
    ? Array.from(
        { length: Math.floor(weaponLevel / 5) },
        (_, index) => (index + 1) * 5,
      ).find((level) => !state.weaponUpgrades.claimedLevels.includes(level))
    : undefined;
  const playerSpeed = getRunPlayerSpeed(state, ADVENTURE_SPEED_SCALE, combat.runUpgrades, combat.runSkill);
  const fireCooldown = getRunFireCooldown(
    getFireCooldown(weaponLevel, rapidFireLevel),
    combat.runUpgrades,
    combat.runSkill,
  );
  const adventureCost = getAdventureDeuteriumCost(state);
  const canStartAdventure = state.resources.deuterium >= adventureCost;

  const startRun = (mode: Mode = 'auto') => {
    if (!canStartAdventure) {
      setCombat((current) => ({
        ...current,
        message: `Nicht genug Deuterium: ${formatNumber(adventureCost)} benoetigt, ${formatNumber(
          state.resources.deuterium,
        )} verfuegbar`,
      }));
      return;
    }

    if (!onStartAdventure()) {
      setCombat((current) => ({
        ...current,
        message: `Nicht genug Deuterium: ${formatNumber(adventureCost)} benoetigt`,
      }));
      return;
    }
    setCombat(createCombat(getPlayerMaxHp(state), mode));
  };

  useEffect(() => {
    const normalize = (key: string) => key.toLowerCase();
    const down = (event: KeyboardEvent) => {
      const key = normalize(event.key);
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        keys.current.add(key);
      }
    };
    const up = (event: KeyboardEvent) => {
      keys.current.delete(normalize(event.key));
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const finishWave = (current: CombatState): CombatState => {
    const reward = getWaveReward(current.wave);
    pendingRewards.current.push(reward);

    if (current.wave >= ADVENTURE_MAX_WAVE) {
      return {
        ...current,
        status: 'victory',
        message: `Alle ${ADVENTURE_MAX_WAVE} Test-Wellen geschafft`,
        log: [`Welle ${current.wave}: ${rewardText(reward)}`, ...current.log].slice(0, 5),
      };
    }

    const nextWave = current.wave + 1;
    const enemies = createEnemies(nextWave, current.nextId);

    return {
      ...current,
      wave: nextWave,
      enemies,
      shots: [],
      fireTimer: 0.55,
      message: `Welle ${nextWave} rueckt an`,
      log: [`Welle ${current.wave}: ${rewardText(reward)}`, ...current.log].slice(0, 5),
      nextId: current.nextId + enemies.length,
    };
  };

  const chooseRunChoice = (choice: RunChoice) => {
    setCombat((current) => {
      if (current.status !== 'choosing') return current;
      const next = { ...current };

      if (choice.kind === 'skill') {
        next.runSkill = choice.key as RunSkillKey;
        next.message = `${choice.title} aktiv fuer diesen Run`;
        return { ...next, status: 'running', choices: [] };
      }

      const key = choice.key as RunUpgradeKey;
      if (key === 'multiShot' && baseProjectileCount + next.runUpgrades.multiShot >= MAX_RUN_PROJECTILES) {
        return current;
      }
      if (key === 'rapidFire' && next.runUpgrades.rapidFire >= MAX_RUN_RAPID_FIRE) {
        return current;
      }
      next.runUpgrades = {
        ...next.runUpgrades,
        [key]: key === 'multiShot'
          ? Math.min(MAX_RUN_PROJECTILES - baseProjectileCount, next.runUpgrades[key] + 1)
          : next.runUpgrades[key] + 1,
      };

      if (key === 'plating') {
        next.playerMaxHp = getRunPlayerMaxHp(
          getPlayerMaxHp(state),
          next.runUpgrades,
        );
        next.playerHp = Math.min(next.playerMaxHp, next.playerHp + 35);
      }

      next.message = `${choice.title} gewaehlt`;
      return { ...next, status: 'running', choices: [] };
    });
  };

  useEffect(() => {
    if (!pendingRewards.current.length) return;

    const rewards = pendingRewards.current;
    pendingRewards.current = [];
    const totalReward = rewards.reduce<Partial<ResourceBag>>((total, reward) => {
      Object.entries(reward).forEach(([key, value]) => {
        const resource = key as keyof ResourceBag;
        total[resource] = (total[resource] ?? 0) + (value ?? 0);
      });
      return total;
    }, {});

    onClaimReward(totalReward);
  }, [combat.log, combat.status, combat.wave, onClaimReward]);

  useEffect(() => {
    if (combat.status !== 'defeat' && combat.status !== 'victory') return;
    const key = `${combat.status}-${combat.wave}-${combat.runLevel}`;
    if (reportedRun.current === key) return;
    reportedRun.current = key;
    onRecordRun({ wave: combat.wave, runLevel: combat.runLevel });
  }, [combat.status, combat.wave, combat.runLevel, onRecordRun]);

  useEffect(() => {
    if (combat.status !== 'running') return undefined;

    const timer = window.setInterval(() => {
      setCombat((current) => {
        if (current.status !== 'running') return current;

        let nextId = current.nextId;
        let message = current.message;
        const explosions = current.explosions
          .map((explosion) => ({
            ...explosion,
            timer: explosion.timer - TICK_SECONDS,
          }))
          .filter((explosion) => explosion.timer > 0);
        let xpOrbs = [...(current.xpOrbs ?? [])];
        const stats = getEnemyStats(current.wave);
        const inputX =
          (keys.current.has('d') || keys.current.has('arrowright') ? 1 : 0) -
          (keys.current.has('a') || keys.current.has('arrowleft') ? 1 : 0);
        const inputY =
          (keys.current.has('s') || keys.current.has('arrowdown') ? 1 : 0) -
          (keys.current.has('w') || keys.current.has('arrowup') ? 1 : 0);
        const inputLength = Math.hypot(inputX, inputY) || 1;

        const enemies = current.enemies.map((enemy) => {
          const chaseX = current.playerX - enemy.x;
          const chaseY = current.playerY - enemy.y;
          const chaseDistance = Math.hypot(chaseX, chaseY) || 1;
          let x =
            enemy.x +
            (enemy.vx * 0.38 + (chaseX / chaseDistance) * (5.2 + current.wave * 0.5)) *
              TICK_SECONDS;
          let y =
            enemy.y +
            (enemy.vy * 0.38 + (chaseY / chaseDistance) * (5.2 + current.wave * 0.5)) *
              TICK_SECONDS;
          let vx = enemy.vx;
          let vy = enemy.vy;

          if (x < 7 || x > 93) vx *= -1;
          if (y < 14 || y > 84) vy *= -1;

          return {
            ...enemy,
            x: Math.max(7, Math.min(93, x)),
            y: Math.max(14, Math.min(84, y)),
            vx,
            vy,
            shotTimer: enemy.shotTimer - TICK_SECONDS,
          };
        });

        const spawnedShots: Shot[] = [];
        let armedEnemies = enemies.map((enemy) => {
          if (enemy.shotTimer > 0) return enemy;
          spawnedShots.push({
            id: nextId,
            owner: 'enemy',
            x: enemy.x,
            y: enemy.y,
            targetX: current.playerX,
            targetY: current.playerY,
            damage: stats.damage,
          });
          nextId += 1;
          return { ...enemy, shotTimer: stats.cadence };
        });
        let pulseTimer = current.pulseTimer;

        if (current.runSkill === 'novaPulse') {
          pulseTimer = Math.max(0, pulseTimer - TICK_SECONDS);
          if (pulseTimer <= 0) {
            armedEnemies = armedEnemies.flatMap((enemy) => {
              const distance = Math.hypot(
                enemy.x - current.playerX,
                enemy.y - current.playerY,
              );
              if (distance > NOVA_RADIUS) return [enemy];
              const hp = enemy.hp - Math.round(playerDamage * 0.72);
              if (hp > 0) return [{ ...enemy, hp }];
              explosions.push({ id: nextId, x: enemy.x, y: enemy.y, timer: 0.58 });
              nextId += 1;
              xpOrbs.push({
                id: nextId,
                x: enemy.x,
                y: enemy.y,
                amount: getEnemyXpDrop(current.wave),
              });
              nextId += 1;
              return [];
            });
            explosions.push({ id: nextId, x: current.playerX, y: current.playerY, timer: 0.72, kind: 'nova' });
            nextId += 1;
            pulseTimer = 8;
            message = 'Nova-Puls entlaedt sich';
          }
        }

        let fireTimer = Math.max(0, current.fireTimer - TICK_SECONDS);
        if (fireTimer <= 0 && armedEnemies.length) {
          const target = getAimTarget(armedEnemies, current.playerX, current.playerY);
          const shots = createPlayerShots(
            current,
            target,
            playerDamage,
            nextId,
            projectileCount,
          );
          spawnedShots.push(...shots);
          nextId += shots.length;
          if (current.runSkill === 'droneWing') {
            spawnedShots.push({
              id: nextId,
              owner: 'player',
              x: current.playerX,
              y: current.playerY + 6,
              targetX: target.x,
              targetY: target.y,
              enemyId: target.id,
              damage: Math.round(playerDamage * 0.45),
            });
            nextId += 1;
          }
          fireTimer = fireCooldown;
          message =
            projectileCount > 1
              ? `${projectileCount} Geschosse erfassen Ziel`
              : 'Auto-Feuer erfasst Ziel';
        }

        const playerVx = (inputX / inputLength) * playerSpeed;
        const playerVy = (inputY / inputLength) * playerSpeed;
        const playerX = Math.max(
          8,
          Math.min(92, current.playerX + playerVx * TICK_SECONDS),
        );
        const playerY = Math.max(
          18,
          Math.min(82, current.playerY + playerVy * TICK_SECONDS),
        );
        const playerAngle =
          inputX || inputY
            ? Math.atan2(inputY, inputX) * (180 / Math.PI) + 90
            : current.playerAngle;
        let playerHp = current.playerHp;
        let remainingEnemies = armedEnemies;
        const movingShots: Shot[] = [];

        [...current.shots, ...spawnedShots].forEach((shot) => {
          const dx = shot.targetX - shot.x;
          const dy = shot.targetY - shot.y;
          const distance = Math.hypot(dx, dy);
          const speed = (shot.owner === 'player' ? 136 : 96) * TICK_SECONDS;

          if (distance > speed) {
            movingShots.push({
              ...shot,
              x: shot.x + (dx / distance) * speed,
              y: shot.y + (dy / distance) * speed,
            });
            return;
          }

          if (shot.owner === 'enemy') {
            const impactDistance = Math.hypot(
              playerX - shot.targetX,
              playerY - shot.targetY,
            );
            if (impactDistance > ENEMY_HIT_RADIUS) {
              message = 'Gegnerschuss ausgewichen';
              return;
            }

            const blocked = Math.min(shieldStrength, shot.damage - 1);
            const damage = Math.max(1, shot.damage - blocked);
            playerHp = Math.max(0, playerHp - damage);
            message = `Schild blockt ${formatNumber(blocked)} · Schaden ${formatNumber(damage)}`;
            return;
          }

          remainingEnemies = remainingEnemies.flatMap((enemy) => {
            if (enemy.id !== shot.enemyId) return [enemy];
            const hp = enemy.hp - shot.damage;
            if (hp > 0) return [{ ...enemy, hp }];
            explosions.push({ id: nextId, x: enemy.x, y: enemy.y, timer: 0.58 });
            nextId += 1;
            xpOrbs.push({
              id: nextId,
              x: enemy.x,
              y: enemy.y,
              amount: getEnemyXpDrop(current.wave),
            });
            nextId += 1;
            message = 'Gegner zerstoert';
            return [];
          });
        });

        let gainedXp = 0;
        xpOrbs = xpOrbs.flatMap((orb) => {
          const distance = Math.hypot(orb.x - playerX, orb.y - playerY);
          if (distance <= XP_PICKUP_RADIUS) {
            gainedXp += orb.amount;
            return [];
          }
          if (distance <= XP_MAGNET_RADIUS) {
            const pull = Math.min(1, (XP_MAGNET_RADIUS - distance) / XP_MAGNET_RADIUS);
            return [{
              ...orb,
              x: orb.x + (playerX - orb.x) * pull * 0.16,
              y: orb.y + (playerY - orb.y) * pull * 0.16,
            }];
          }
          return [orb];
        });

        let runLevel = current.runLevel;
        let runXp = current.runXp + gainedXp;
        let runXpTarget = current.runXpTarget;
        let status = current.status;
        let choices = current.choices;

        if (runXp >= runXpTarget) {
          runXp -= runXpTarget;
          runLevel += 1;
          runXpTarget = getRunXpTarget(runLevel);
          choices = getRunChoicesForLevel(
            runLevel,
            baseProjectileCount,
            current.runUpgrades,
          );
          status = 'choosing';
          message =
            runLevel % 10 === 0
              ? `Run-Level ${runLevel}: Spezialskill waehlen`
              : `Run-Level ${runLevel}: Upgrade waehlen`;
        } else if (gainedXp > 0) {
          message = `XP +${formatNumber(gainedXp)}`;
        }

        if (playerHp <= 0) {
          return {
            ...current,
            status: 'defeat',
            playerHp: 0,
            playerX,
            playerY,
            playerAngle,
            playerVx,
            playerVy,
            enemies: remainingEnemies,
            shots: movingShots,
            explosions,
            xpOrbs,
            runLevel,
            runXp,
            runXpTarget,
            message: `Rakete in Welle ${current.wave} verloren`,
            nextId,
          };
        }

        const updated: CombatState = {
          ...current,
          enemies: remainingEnemies,
          shots: status === 'choosing' ? [] : movingShots,
          explosions,
          xpOrbs,
          playerX,
          playerY,
          playerAngle,
          playerVx,
          playerVy,
          playerHp,
          fireTimer,
          pulseTimer,
          runLevel,
          runXp,
          runXpTarget,
          status,
          choices,
          message,
          nextId,
        };

        if (status === 'choosing') return updated;
        if (!remainingEnemies.length) return finishWave(updated);
        return updated;
      });
    }, TICK_SECONDS * 1000);

    return () => window.clearInterval(timer);
  }, [
    combat.status,
    fireCooldown,
    onClaimReward,
    playerDamage,
    playerSpeed,
    projectileCount,
    shieldStrength,
  ]);

  const playerPercent = (combat.playerHp / combat.playerMaxHp) * 100;
  const xpPercent = (combat.runXp / Math.max(1, combat.runXpTarget)) * 100;

  return (
    <section
      className="adventure-view"
      aria-label="Abenteuer"
      style={
        {
          '--adventure-bg-image': `url(${getAssetUrl(rocket.worldAsset)})`,
          '--enemy-image-0': `url(${getAssetUrl(rocket.enemyAssets[0])})`,
          '--enemy-image-1': `url(${getAssetUrl(rocket.enemyAssets[1])})`,
          '--enemy-image-2': `url(${getAssetUrl(rocket.enemyAssets[2])})`,
          '--rocket-image': `url(${getAssetUrl(rocket.rocketAsset)})`,
        } as CSSProperties
      }
    >
      <div className="adventure-header">
        <div><h2>Abenteuer</h2><p>Steuere mit WASD oder Pfeiltasten. Die Rakete feuert automatisch.</p></div>
        <div className="adventure-actions">
          <button onClick={() => startRun('auto')}>
            <FastForward size={17} />
            Start Auto · {formatNumber(adventureCost)} D
          </button>
          <small>
            Deuterium {formatNumber(state.resources.deuterium)} /{' '}
            {formatNumber(adventureCost)}
          </small>
        </div>
      </div>

      <div className="adventure-arena">
        <div className="rocket-combat-card">
          <span className="combat-tag">Explorer I</span>
          <h3>{rocket.name}</h3>
          <Progress className="game-progress" value={playerPercent} />
          <span>Huelle {formatNumber(combat.playerHp)} / {formatNumber(combat.playerMaxHp)}</span>
          <small>Run-Level {combat.runLevel} · XP {formatNumber(combat.runXp)} / {formatNumber(combat.runXpTarget)}</small>
          <Progress className="game-progress run-xp-progress" value={xpPercent} />
          <small>{getBaseRunSummary(state)} · Laser {laserLevel} · Schaden {formatNumber(playerDamage)}</small>
          <small>Waffenbonus: Schussrate +{rapidFirePercent}% · Geschosse {projectileCount}/5</small>
          <small>Run: Feuer +{combat.runUpgrades.rapidFire * 12}% · Multi +{combat.runUpgrades.multiShot} · Panzerung +{combat.runUpgrades.plating * 35}</small>
          <small>Spezial: {combat.runSkill ? combat.runSkill : 'noch keiner'}</small>
          {pendingWeaponMilestone ? (
            <small>Upgrade bereit bei Waffenmodul {pendingWeaponMilestone}.</small>
          ) : null}
        </div>

        <div className="wave-field">
          <span className="wave-count">Welle {combat.status === 'idle' ? 0 : combat.wave} / {ADVENTURE_MAX_WAVE}</span>
          {combat.status === 'choosing' ? (
            <RunChoicePanel
              choices={combat.choices}
              onChoose={chooseRunChoice}
              runLevel={combat.runLevel}
            />
          ) : null}
          <span
            className="player-ship-marker"
            style={
              {
                '--player-angle': `${combat.playerAngle}deg`,
                left: `${combat.playerX}%`,
                top: `${combat.playerY}%`,
              } as CSSProperties
            }
          />
          {combat.enemies.map((enemy) => (
            <span
              aria-label={`Gegner ${formatNumber(enemy.hp)} von ${formatNumber(enemy.maxHp)}`}
              className={`enemy-fighter variant-${enemy.variant}`}
              key={enemy.id}
              style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
              title={`Gegner ${formatNumber(enemy.hp)} / ${formatNumber(enemy.maxHp)}`}
            >
              <span className="enemy-sprite" />
              <Progress
                className="game-progress enemy-mini-progress"
                value={(enemy.hp / enemy.maxHp) * 100}
              />
            </span>
          ))}
          {(combat.xpOrbs ?? []).map((orb) => (
            <span
              className="xp-orb"
              key={orb.id}
              style={{ left: `${orb.x}%`, top: `${orb.y}%` }}
              title={`XP +${formatNumber(orb.amount)}`}
            />
          ))}
          {combat.shots.map((shot) => (
            <span
              className={`combat-shot ${shot.owner}`}
              key={shot.id}
              style={{ left: `${shot.x}%`, top: `${shot.y}%` }}
            />
          ))}
          {combat.explosions.map((explosion) => (
            <span
              className={`combat-explosion ${explosion.kind ?? 'blast'}`}
              key={explosion.id}
              style={{ left: `${explosion.x}%`, top: `${explosion.y}%` }}
            />
          ))}
          <p>{combat.message}</p>
          <span className="fire-button">Auto-Feuer</span>
        </div>

        <div className="reward-card">
          <Shield size={24} />
          <h3>Beute</h3>
          <p>Wellen liefern Titan, Deuterium, Silizium und Alien-Partikel.</p>
          <div className="reward-log">
            {combat.log.length ? (
              combat.log.map((entry) => <span key={entry}>{entry}</span>)
            ) : (
              <span>Noch keine Beute</span>
            )}
          </div>
          {combat.status === 'defeat' || combat.status === 'victory' ? (
            <button onClick={() => startRun(combat.mode)}>
              <RotateCcw size={17} />
              Nochmal starten
            </button>
          ) : null}
          {pendingWeaponMilestone ? (
            <div className="achievement-picker">
              <button
                disabled={rapidFireLevel >= MAX_RAPID_FIRE_UPGRADES}
                onClick={() => onChooseWeaponUpgrade('rapidFire')}
              >
                Schnellfeuer +10%
              </button>
              <button
                disabled={multiShotLevel >= MAX_MULTI_SHOT_UPGRADES}
                onClick={() => onChooseWeaponUpgrade('multiShot')}
              >
                Mehrfachschuss +1
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="wave-track" aria-hidden="true">
        {Array.from({ length: ADVENTURE_MAX_WAVE }, (_, index) => (
          <span
            className={index + 1 < combat.wave ? 'cleared' : ''}
            key={index}
          />
        ))}
      </div>
    </section>
  );
}
