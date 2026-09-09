import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RocketMinerGame } from '@/components/game/RocketMinerGame';
import '@/app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RocketMinerGame />
  </StrictMode>,
);
