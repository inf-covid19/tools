import React from "react";
import { Segment, Header } from "semantic-ui-react";

function ChartWrapper({ title, subtitle, children }: React.PropsWithChildren<{ title: string; subtitle: string | React.ReactNode }>) {
  return (
    <div>
      <Segment>
        <Header as="h3">
          {title}

          <Header.Subheader>{subtitle}</Header.Subheader>
        </Header>
        <div>{children}</div>
      </Segment>
    </div>
  );
}

export default ChartWrapper;
