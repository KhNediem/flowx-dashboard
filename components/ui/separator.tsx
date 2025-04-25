import * as React from "react";

export function Separator({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "h-px w-full my-4 bg-gray-200 dark:bg-gray-700 " + className
      }
      {...props}
    />
  );
}
