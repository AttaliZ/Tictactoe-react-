import React from 'react';

const Square = ({ value, onClick }) => {
  const squareClass = `square ${value?.toLowerCase() || ''}`;
  
  return (
    <button className={squareClass} onClick={onClick}>
      {value}
    </button>
  );
};

export default Square;