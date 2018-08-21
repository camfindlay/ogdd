import React from 'react';
import styled from 'styled-components';
import Label from 'components/Label';

const Styled = styled.div`
  animation: pulsate 1s ease-out;
  animation-iteration-count: infinite;
  opacity: 0.5;
  @keyframes pulsate {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1.0;
    }
    100% {
      opacity: 0.5;
    }
  }
`;

/**
  * Simple text loader
  *
  * @return {Component} Loading
  *
  */
const Loading = () => (
  <Styled>
    <Label id="app.loading" />
  </Styled>
);

export default Loading;
