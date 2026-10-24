import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {Scene} from '../src/Main';
import {Captions} from '../src/Captions';
let setT: (t: number) => void = () => {};
const App = () => {
  const [t, s] = useState(0);
  setT = s;
  return (
    <div data-composition-id="main" data-duration="36.3" style={{position: 'relative', width: 1080, height: 1920, overflow: 'hidden', background: '#0F1840'}}>
      <Scene t={t} />
      <Captions t={t} />
    </div>
  );
};
(window as any).__duration = 36.3;
(window as any).__seek = (t: number) => new Promise((res) => { flushSync(() => setT(t)); requestAnimationFrame(() => requestAnimationFrame(() => res(null))); });
createRoot(document.getElementById('root')!).render(<App />);
