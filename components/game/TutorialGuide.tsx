import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getCargoUsed } from '@/lib/game/simulation';
import type { GameState, ViewKey } from '@/lib/game/types';

const guideSteps: Array<{
  targetView: ViewKey;
  title: string;
  text: string;
  action: string;
}> = [
  {
    targetView: 'space',
    title: 'Meteoriten abbauen',
    text: 'Klicke im Weltraum auf einen grossen Meteoriten. So bekommst du Metall fuer die ersten Gebaeude.',
    action: 'Zum Weltraum',
  },
  {
    targetView: 'space',
    title: 'Laser verbessern',
    text: 'Links bei den Weltraum-Modulen kannst du den Bergbau-Laser verbessern. Danach gehen Meteoriten schneller kaputt.',
    action: 'Zum Weltraum',
  },
  {
    targetView: 'space',
    title: 'Metall sichern',
    text: 'Sammle Metall und schicke die Rakete bei Bedarf zur Basis. Metall ist der Rohstoff fuer fast alles.',
    action: 'Zum Weltraum',
  },
  {
    targetView: 'city',
    title: 'Forschungszentrum bauen',
    text: 'Wechsle in die Stadt, waehle ein freies Baufeld und baue das Forschungszentrum. Danach kannst du Forschung nutzen.',
    action: 'Zur Stadt',
  },
  {
    targetView: 'city',
    title: 'Raumfahrtzentrum vorbereiten',
    text: 'Baue und verbessere das Raumfahrtzentrum. Dort entsteht spaeter die naechste Rakete fuer neue Gebiete.',
    action: 'Zur Stadt',
  },
];

export function TutorialGuide({
  state,
  onChangeView,
}: {
  state: GameState;
  onChangeView: (view: ViewKey) => void;
}) {
  if (!state.tutorialActive) return null;

  const step = guideSteps[state.questIndex];
  const cargoUsed = getCargoUsed(state);
  const current = state.quest.done || !step
    ? {
        targetView: 'adventure' as ViewKey,
        title: 'Tutorial abgeschlossen',
        text: 'Du kennst jetzt die Basis: Weltraum fuer Metall, Stadt fuer Gebaeude, Forschung fuer neue Raketen und Abenteuer fuer Beute.',
        action: 'Zum Abenteuer',
      }
    : step;
  const wrongView = state.view !== current.targetView;
  const progress = `${state.quest.current} / ${state.quest.target}`;

  return (
    <section className="tutorial-guide" aria-label="Tutorial-Hinweis">
      <div>
        <span>{state.quest.done ? 'Fertig' : `Schritt ${state.questIndex + 1}`}</span>
        <h2>{current.title}</h2>
        <p>
          {current.text}
          {state.questIndex === 2 && cargoUsed > 0
            ? ` Im Frachtraum liegen gerade ${Math.round(cargoUsed)} Metall.`
            : ''}
        </p>
        {!state.quest.done ? <small>Fortschritt: {progress}</small> : null}
      </div>
      {wrongView ? (
        <button onClick={() => onChangeView(current.targetView)} type="button">
          {current.action}
          <ArrowRight size={17} />
        </button>
      ) : (
        <strong>
          <CheckCircle2 size={17} />
          Richtiger Bereich
        </strong>
      )}
    </section>
  );
}
