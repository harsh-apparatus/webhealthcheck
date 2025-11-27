"use client";

import { useEffect } from "react";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import { useLoader } from "@/contexts/LoaderContext";

const page = () => {
  const { setLoading } = useLoader();

  const handleClick = () => {
    console.log("Button clicked!");
    alert("Button clicked!");
  };

  const handleLoaderDemo = () => {
    setLoading(true);
    // Simulate async operation
    setTimeout(() => {
      setLoading(false);
    }, 20000);
  };

  return (
    <div className="p-4">
      <h1 className="h1 mb-4">Dashboard</h1>
      <div className="flex gap-4">
        <ButtonPrimary name="Click me" onclick={handleClick} />
        <ButtonPrimary name="Test Loader" onclick={handleLoaderDemo} />
      </div>
    </div>
  );
};

export default page;
