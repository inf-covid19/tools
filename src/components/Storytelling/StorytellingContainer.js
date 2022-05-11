import React from "react";
import SingleLocationContainer from "../Base/SingleLocationContainer";
import LocationContainer from "./LocationContainer";

function StorytellingContainer() {
  return <SingleLocationContainer route="/insights-visualizer">{({ currentLocation }) => <LocationContainer location={currentLocation} />}</SingleLocationContainer>;
}

export default StorytellingContainer;
