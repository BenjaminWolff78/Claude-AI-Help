import React from 'react';
import {registerRoot, Still} from 'remotion';
import {RaiseThumb} from './raise/Thumb';

const ThumbRoot: React.FC = () => React.createElement(Still, {id: 'RaiseThumb', component: RaiseThumb, width: 1280, height: 720});
registerRoot(ThumbRoot);
