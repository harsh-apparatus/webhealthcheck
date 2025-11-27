import React from "react";
import ButtonPrimary from "../button/ButtonPrimary";

const Upgrade = () => {
  return (
    <div className="p-4">
      <div className="flex flex-col items-center justify-center accent-grad  px-4 py-8 rounded-lg">
        <p className="!text-xs text-white text-center">
          Get access to all features and benefits of the Pro plan.
        </p>
        <ButtonPrimary name="Upgrade Now" className="mt-4" onclick={() => {}} />
      </div>
    </div>
  );
};

export default Upgrade;
