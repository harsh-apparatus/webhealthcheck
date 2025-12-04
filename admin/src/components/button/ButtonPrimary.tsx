"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface ButtonPrimaryProps {
  name: string;
  icon?: ReactNode;
  onclick?: () => void;
  link?: string;
  target?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const ButtonPrimary = ({
  name,
  icon,
  onclick,
  link,
  target,
  className,
  type = "button",
  disabled = false,
}: ButtonPrimaryProps) => {
  const baseClasses = " btn-primary flex items-center gap-2";
  const combinedClasses = className
    ? `${baseClasses} ${className}`
    : baseClasses;

  if (link) {
    return (
      <Link
        href={link}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={combinedClasses}
      >
        {icon && <span>{icon}</span>}
        <span>{name}</span>
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onclick}
      className={combinedClasses}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      <span>{name}</span>
    </button>
  );
};

export default ButtonPrimary;
