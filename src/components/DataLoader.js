import React from "react";
import { Loader } from "semantic-ui-react";
import styled from "styled-components";

function DataLoader() {
  return (
    <LoaderWrapper>
      <Loader active inline />
    </LoaderWrapper>
  );
}

export default DataLoader;

const LoaderWrapper = styled.div`
  height: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
