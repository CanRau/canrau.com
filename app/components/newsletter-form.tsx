export const NewsletterForm = () => {
  return (
    <div id="revue-embed">
      <h2 className="text-2xl dark:text-zinc-100">
        Follow the progress of this site
      </h2>

      <form
        action="https://www.getrevue.co/profile/CanRau/add_subscriber"
        method="post"
        id="revue-form"
        name="revue-form"
        target="_blank"
        className="mt-4"
      >
        <div className="flex flex-col">
          <label htmlFor="member_email">Email address</label>
          <input
            placeholder="Your email address..."
            className="revue-form-field bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
            type="email"
            name="member[email]"
            id="member_email"
          />
        </div>
        <div className="flex flex-col mt-4">
          <label htmlFor="member_first_name">
            First name <span className="optional">(Optional)</span>
          </label>
          <input
            placeholder="First name... (Optional)"
            className="revue-form-field bg-zinc-300 text-black placeholder:text-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-400 px-4 py-2 mt-1 rounded-md"
            type="text"
            name="member[first_name]"
            id="member_first_name"
          />
        </div>
        <div className="revue-form-actions mt-4">
          <button
            type="submit"
            name="member[subscribe]"
            id="member_submit"
            className="mt-2 px-4 py-2 w-full bg-[#6c63ff] text-white font-bold rounded-md"
          >
            Subscribe for free
          </button>
        </div>
        <div className="revue-form-footer mt-4">
          By subscribing, you agree with Revue’s{" "}
          <a target="_blank" href="https://www.getrevue.co/terms">
            Terms of Service
          </a>{" "}
          and{" "}
          <a target="_blank" href="https://www.getrevue.co/privacy">
            Privacy Policy
          </a>
          .
        </div>
      </form>
    </div>
  );
};
