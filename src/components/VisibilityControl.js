import React, { useState } from "react";
import styled from "styled-components";

import { Button, Icon } from "semantic-ui-react";

function VisibilityControl({ children }) {
  const [isHidden, setHidden] = useState();

  return (
    <>
      <FloatingButton>
        <Button icon onClick={() => setHidden(!isHidden)}>
          <Icon name={isHidden ? "eye" : "eye slash"} />
        </Button>
      </FloatingButton>

      {!isHidden && children}
    </>
  );
}

export default VisibilityControl;

const FloatingButton = styled.div`
  position: absolute;
  z-index: 1000;
  top: 10px;
  right: 10px;
`;
