import styled from 'styled-components';

export default styled.div`
  box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.2);
  margin: 5px 5px 25px;
  padding: 4px 10px 10px;
  &:hover {
    ${(props) => props.onMouseEnter ? 'box-shadow: 0px 0px 8px 0px rgba(0,0,0,0.6);' : ''}
    ${(props) => props.onClick ? 'cursor: pointer;' : ''}
  }
`;