import styled from 'styled-components';
import { BREAKPOINTS } from 'containers/App/constants';

/**
  * @component
  * Card header wrapper
  *
  */
export default styled.div`
  position: relative;
  padding-bottom: 10px;
  padding-right: ${(props) => props.dismissable ? 50 : 0}px;
  @media (min-width: ${(props) => props.theme.breakpoints[BREAKPOINTS.SMALL]}) {
    padding-right: 0;
    min-height: ${(props) => props.hasMinHeight ? '60px' : 0};
  }
  @media print {
    min-height: 0;
  }
`;
