import React from "react";

export const Logo = ({ size = 22, style = {} }) => {
  return (
    <img
      src="/favicon.png"
      alt="CodeCollab Logo"
      width={size}
      height={size}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        borderRadius: "20%", // matches the squircle shape
        ...style
      }}
    />
  );
};

export default Logo;
