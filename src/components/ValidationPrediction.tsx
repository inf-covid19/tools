import React from "react";
import { Modal, Dropdown } from "semantic-ui-react";
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

  return (
    <React.Fragment>
      <Dropdown className="button" text="Validate">
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
      <Modal size="fullscreen" open={isModalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>Validate {selectedRegionTitle} predictions</Modal.Header>
        <Modal.Content>
          <ValidationChart
            {...props.options}
            selectedRegions={{ [selectedRegion]: true }}
            predictionDays={0}
            height={600}
            title={"Heatmap of prediction's error for " + selectedRegionTitle}
          />
        </Modal.Content>
      </Modal>
    </React.Fragment>
  );
}
