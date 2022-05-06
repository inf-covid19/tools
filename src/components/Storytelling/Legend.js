import React from "react";
import styled from "styled-components";
import { first, last } from "lodash";

function Legend({ legends }) {
  return (
    <Container>
      {legends.map(({ name, possibleValues, colorSchema }) => {
        return (
          <Item key={name}>
            <Title>{name}</Title>
            <Value>{first(possibleValues)}</Value>
            {possibleValues.map((value) => (
              <Square key={value} color={colorSchema(value)}></Square>
            ))}
            <Value>{last(possibleValues)}</Value>
          </Item>
        );
      })}
    </Container>
  );
}

export default Legend;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const Title = styled.div`
  margin-right: 10px;
  font-weight: bolder;
`;

const Value = styled.div`
  margin-right: 5px;
`;

const Square = styled.div`
  height: 15px;
  width: 15px;
  background: ${(props) => props.color};
  /* border: 1px solid #ccc; */
  margin-right: 5px;

  & + & {
    margin-left: -5px;
  }
`;
