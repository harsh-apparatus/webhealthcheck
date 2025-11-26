"use client";

import ButtonPrimary from "@/components/button/ButtonPrimary";

const page = () => {
  const handleClick = () => {
    console.log("Button clicked!");
    alert("Button clicked!");
  };

  return (
    <div>
      <ButtonPrimary name="Click me" onclick={handleClick} />
    </div>
  );
};

export default page;
