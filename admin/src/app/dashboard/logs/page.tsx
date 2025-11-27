"use client";

import ButtonPrimary from '@/components/button/ButtonPrimary';


const page = () => {
  return (
    <div className='p-4'>
      <NoLogs />
    </div>
  )
}

export default page





function NoLogs() {

  const handleAddWebsite = () => {
    console.log("Add Website");
  };
  return (
    <div className="card-highlight  h-[300px] flex flex-col justify-center items-center gap-2">
      <h2 className="h2">You currently have no websites registered
      </h2>
      <p>Register a website to get started with your website.</p>
      <ButtonPrimary name="Add Website" className="mt-8" onclick={handleAddWebsite} />
    </div>
  );
}