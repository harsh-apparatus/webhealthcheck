"use client";

import { Cardio } from "ldrs/react";
import "ldrs/react/Cardio.css";

interface LoaderProps {
  isLoading: boolean;
}

const Loader = ({ isLoading }: LoaderProps) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <Cardio size="100" stroke="4" speed="2" color="var(--accent)" />
    </div>
  );
};

export default Loader;
