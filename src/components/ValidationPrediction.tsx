import React from "react";
import { Modal, Dropdown, Button } from "semantic-ui-react";
import ValidationChart, { ValidationChartProps } from "./ValidationChart";
import { getByRegionId } from "../utils/metadata";
import useMetadata from "../hooks/useMetadata";

type Props = {
  options: ValidationChartProps;
};

export default function ValidationPrediction(props: Props) {
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [selectedRegion, setSelectedRegion] = React.useState("");

  const { data: metadata } = useMetadata();
  if (!metadata) return null;

  const getRegionTitle = (id: string) => {
    return getByRegionId(metadata, id).displayName;
  };

  const selectedRegionTitle = selectedRegion ? getRegionTitle(selectedRegion) : "";

  const filteredRegions = Object.entries(props.options.selectedRegions).filter(([isSelected]) => isSelected);

  return (
    <React.Fragment>
      {filteredRegions.length <= 1 ? (
        <Button
          style={{ float: "right", zIndex: 1000 }}
          content="How accurate is it?"
          className="basic small"
          icon="info circle"
          labelPosition="left"
          disabled={filteredRegions.length <= 0}
          onClick={() => {
            setSelectedRegion(filteredRegions[0][0]);
            setModalOpen(true);
          }}
        />
      ) : (
        <Dropdown style={{ float: "right", zIndex: 1000 }} text="How accurate is it?" className="basic small button icon" labeled floating icon="info circle">
          <Dropdown.Menu>
            {Object.entries(props.options.selectedRegions).map(([region, isSelected], index) => {
              return (
                isSelected && (
                  <Dropdown.Item
                    key={index}
                    text={getRegionTitle(region)}
                    onClick={() => {
                      setSelectedRegion(region);
                      setModalOpen(true);
                    }}
                  />
                )
              );
            })}
          </Dropdown.Menu>
        </Dropdown>
      )}
      <Modal size="fullscreen" open={isModalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>Prediction Error for {selectedRegionTitle} in the last 30, 20, 10, 5 and 1 days.</Modal.Header>
        <Modal.Content>
          <ValidationChart {...props.options} chartType="heatmap" selectedRegions={{ [selectedRegion]: true }} predictionDays={0} height={600} title="" />
        </Modal.Content>
      </Modal>
    </React.Fragment>
  );
}
