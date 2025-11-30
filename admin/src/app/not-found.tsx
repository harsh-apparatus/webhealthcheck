import ButtonPrimary from "@/components/button/ButtonPrimary";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      <div className="flex flex-col items-center justify-center text-center">

        <div className="h-full max-h-[500px] w-full max-w-[1000px] aspect-[21/9] relative bg-gray-200 rounded-lg overflow-hidden ">
        <Image src="/404meme.gif" alt="404 meme" fill className="object-cover" />
        </div>
        

        <p className="text-xl mb-8 opacity-75">
          Oops! you were not supposed to see this page.
        </p>

        <ButtonPrimary name="Go Home" link="/" />
      </div>
    </div>
  );
}
