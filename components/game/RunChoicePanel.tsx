import type { RunChoice } from '@/lib/game/adventureRun';

export function RunChoicePanel({
  choices,
  runLevel,
  onChoose,
}: {
  choices: RunChoice[];
  runLevel: number;
  onChoose: (choice: RunChoice) => void;
}) {
  return (
    <div className="run-choice-panel">
      <strong>
        {choices[0]?.kind === 'skill'
          ? 'Spezialskill waehlen'
          : `Run-Level ${runLevel}: Upgrade waehlen`}
      </strong>
      <small>Gilt nur fuer diesen Abenteuer-Run und verschwindet danach.</small>
      <div className="run-choice-grid">
        {choices.map((choice) => (
          <button key={choice.key} onClick={() => onChoose(choice)} type="button">
            <span>{choice.title}</span>
            <small>{choice.description}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
