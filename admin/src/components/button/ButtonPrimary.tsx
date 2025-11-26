"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface ButtonPrimaryProps {
  name: string;
  icon?: ReactNode;
  onclick?: () => void;
  link?: string;
  target?: string;
  className?: string;
}

const ButtonPrimary = ({
  name,
  icon,
  onclick,
  link,
  target,
  className,
}: ButtonPrimaryProps) => {
  const baseClasses =
    " btn-primary";
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
    <button type="button" onClick={onclick} className={combinedClasses}>
      {icon && <span>{icon}</span>}
      <span>{name}</span>
    </button>
  );
};

export default ButtonPrimary;

