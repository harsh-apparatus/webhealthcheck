"use client";
import ButtonPrimary from "@/components/button/ButtonPrimary";

const page = () => {
  return (
    <>
        <div className="flex justify-between my-10 items-center border-b border-border pb-4">
          <h1 className="h2">Websites</h1>
          <ButtonPrimary name="Add Website" link="/dashboard/websites/add" />
        </div>

        <NoWebsites />
     </>
  );
};

export default page;




function NoWebsites() {
  return (
    <div className="card-highlight  h-[300px] flex flex-col justify-center items-center gap-2">
      <h2 className="h2">You currently have no websites registered
      </h2>
      <p>Register a website to get started with your website.</p>
      <ButtonPrimary name="Add Website" className="mt-8" link="/dashboard/websites/add" />
    </div>
  );
}