import React from "react";
import SingleLocationContainer from "../Base/SingleLocationContainer";
import LocationContainer from "./LocationContainer";

function SimilarityDebuggerContainer() {
  return <SingleLocationContainer route="/similarity-debugger">{({ currentLocation }) => <LocationContainer currentLocation={currentLocation} />}</SingleLocationContainer>;
}

export default SimilarityDebuggerContainer;
