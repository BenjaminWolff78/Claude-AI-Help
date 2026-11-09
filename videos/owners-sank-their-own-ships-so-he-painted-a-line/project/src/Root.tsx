import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/ice/Bridge";
import { CastSheet } from "./CastSheet";
export const Root: React.FC = () => (<>
  <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="BridgeArt" component={BridgeShort} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ w: 1080, h: 1920 }}
    calculateMetadata={({ props }) => ({ width: (props as { w?: number }).w ?? 1080, height: (props as { h?: number }).h ?? 1920 })} />
  <Composition id="CastSheet" component={CastSheet} durationInFrames={1} fps={30} width={2400} height={1520} />
</>);
