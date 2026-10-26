import { NavigateFunction } from "react-router-dom";

let navigateFn: NavigateFunction | null = null;

export const setGlobalNavigate = (fn: NavigateFunction) => {
  navigateFn = fn;
};

export const globalNavigate = (to: string, options?: any) => {
  if (navigateFn) {
    navigateFn(to, options);
  } else {
    // Fallback if called before router mounts
    window.location.href = to;
  }
};
