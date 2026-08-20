"use client";
import { useCurrentContext } from "@/hooks/use-context";

export default function Home() {
  const { data: context } = useCurrentContext();
  console.log("context", context);
  return <div className="h-full">asfsa</div>;
}
