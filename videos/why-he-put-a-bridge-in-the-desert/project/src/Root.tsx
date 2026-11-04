import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/ice/Bridge";
import { CastSheet } from "./CastSheet";
export const Root: React.FC = () => (<>
  <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
  <Composition id="CastSheet" component={CastSheet} durationInFrames={1} fps={30} width={2400} height={1520} />
</>);
