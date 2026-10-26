import { auth } from "@/lib/auth/server";

// Signed-out visitors to the account pages go to Google sign-in. Group pages stay
// public: the share link alone grants access.
export default auth.middleware({ loginUrl: "/sign-in" });

export const config = {
  matcher: ["/groups", "/groups/:path*"],
};
