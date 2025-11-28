import ButtonPrimary from "@/components/button/ButtonPrimary";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className="text-9xl font-bold mb-4 animate-bounce"
          style={{
            background:
              "linear-gradient(to right, rgb(77, 1, 171), rgb(117, 1, 167))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>

        <p className="text-xl mb-8 opacity-75">
          This page has left the chat 💨
        </p>

        <ButtonPrimary name="Go Home" link="/" />
      </div>
    </div>
  );
}
