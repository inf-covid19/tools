import React from "react";
import styled from "styled-components";
import Figure from "../../assets/SVG/DrawKit Vector Illustration Team Work (2).svg";

import { Header } from "semantic-ui-react";

function MaintenanceBanner() {
  return (
    <Container>
      <ContentWrapper>
        <Header as="h1" content="Maintenence Notice" subheader="This module is under maintenence. Please explore the other modules and try again later." />
      </ContentWrapper>
      <ImageWrapper>
        <img src={Figure} alt="Illustration about team working." />
      </ImageWrapper>
    </Container>
  );
}

export default MaintenanceBanner;

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;

  @media screen and (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: right;
  @media screen and (max-width: 1024px) {
    text-align: center;
  }
`;

const ImageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  @media screen and (max-width: 1024px) {
    align-items: center;
  }
  img {
    height: 45vh;
  }
`;
