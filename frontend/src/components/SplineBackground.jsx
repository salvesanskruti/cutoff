import React from "react";

const SplineBackground = () => {
  return (
    <iframe
      src="https://my.spline.design/particles-2AYntdNtbHx6WxnMJdEw4tI7/"
      frameBorder="0"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "110%",
        zIndex: -1,   // 🔥 behind everything
        pointerEvents: "none" // 👈 allows clicking UI
      }}
    />
  );
};

export default SplineBackground;