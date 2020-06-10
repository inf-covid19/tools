import React, { useMemo } from "react";
import { Modal, Dropdown } from "semantic-ui-react";
import { subDays } from "date-fns";
import { first, last } from "lodash";
import ValidationChart, { ValidationChartProps } from "./ValidationChart";

type Props = {
  options: ValidationChartProps;
};

export default function PreviousPrediction(props: Props) {
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [dayInterval, setDayInterval] = React.useState(10);
  const [selectedRegion, setSelectedRegion] = React.useState("");

  const getRegionTitle = (v: string) => {
    const [rest, region] = [first(v.split(":")), last(v.split(":"))];

    const [country, state] = [first(rest?.split(".")), last(rest?.split("."))];

    return `${region}, ${state}, ${country}`;
  };

  const selectedRegionTitle = useMemo(() => getRegionTitle(selectedRegion), [selectedRegion]);

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
      <Modal open={isModalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>Validate {selectedRegionTitle} predictions</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <p>Choose days range to compare real values with our algorithm predictions.</p>
            <Dropdown className="button" text={`${dayInterval} days range`}>
              <Dropdown.Menu>
                {[5, 10, 15, 20, 30].map((diff, index) => (
                  <Dropdown.Item
                    key={index}
                    text={`${diff} days`}
                    selected={dayInterval === diff}
                    onClick={() => {
                      setDayInterval(diff);
                    }}
                  />
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Modal.Description>
          <br></br>
          {dayInterval && (
            <ValidationChart
              {...props.options}
              selectedRegions={{ [selectedRegion]: true }}
              predPreviousDate={subDays(new Date(), dayInterval)}
              dayInterval={Math.abs(dayInterval * 2)}
              height={600}
              title={"Validation chart for " + selectedRegionTitle}
            />
          )}
          ;
        </Modal.Content>
      </Modal>
    </React.Fragment>
  );
}
