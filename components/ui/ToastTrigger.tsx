"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useToast } from "@/lib/toast-context";

export function ToastTrigger() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { show } = useToast();

  useEffect(() => {
    const created = searchParams.get("created");
    const error = searchParams.get("error");
    const msg = searchParams.get("msg");

    if (created === "1") show("Goal created successfully!", "success");
    if (error) show(decodeURIComponent(error), "error");
    if (msg) show(decodeURIComponent(msg), "info");

    if (created || error || msg) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("created");
      params.delete("error");
      params.delete("msg");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
