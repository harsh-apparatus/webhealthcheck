"use client";

import { useState } from "react";


const Toggle = ({ isChecked, onChange ,onText,offText }: { isChecked: boolean, onChange: (checked: boolean) => void, onText: string, offText: string }) => {
  const [toggle, setToggle] = useState(false);

  const handleChange = () => {
    setToggle(!toggle);
    onChange(toggle);
  }

  return (
    <div className="flex items-center gap-2 h-[42px] cursor-pointer pl-2" onClick={handleChange} >
        <div className={`w-9 h-4  rounded-full flex items-center justify-center relative ${isChecked ? "bg-accent" : "bg-gray"}`}>
            <div className={`w-5 aspect-square ${"bg-white"} rounded-full transition absolute left-0 shadow1 ${!toggle ? "left-4" : "left-0"}`} ></div>
        </div>
        <p className={`text-sm `}>{!toggle ? onText : offText}</p>
      
    </div>
  )
}

export default Toggle