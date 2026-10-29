import { HomePage } from "@/components/home/HomePage";

// Our Work lists restaurants published from the admin; publishing refreshes it at once
export const revalidate = 60;

export default function Page() {
  return <HomePage locale="en" />;
}
