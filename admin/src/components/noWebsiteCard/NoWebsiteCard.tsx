import ButtonPrimary from "../button/ButtonPrimary";

const NoWebsiteCard = () => {
  return (
    <div className="card-highlight  h-[300px] flex flex-col justify-center items-center gap-2">
      <h2 className="h2">You currently have no websites registered</h2>
      <p>Register a website to get started with your website.</p>
      <ButtonPrimary
        name="Add Website"
        className="mt-8"
        link="/dashboard/websites/add"
      />
    </div>
  );
};

export default NoWebsiteCard;
